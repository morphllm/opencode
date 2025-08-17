import type { Argv } from "yargs"
import { Bus } from "../../bus"
import { Provider } from "../../provider/provider"
import { Session } from "../../session"
import { UI } from "../ui"
import { cmd } from "./cmd"
import { Flag } from "../../flag/flag"
import { Config } from "../../config/config"
import { bootstrap } from "../bootstrap"
import { MessageV2 } from "../../session/message-v2"
import { Identifier } from "../../id/id"
import { Agent } from "../../agent/agent"
import { readFileSync, existsSync } from "fs"

const TOOL: Record<string, [string, string]> = {
  todowrite: ["Todo", UI.Style.TEXT_WARNING_BOLD],
  todoread: ["Todo", UI.Style.TEXT_WARNING_BOLD],
  bash: ["Bash", UI.Style.TEXT_DANGER_BOLD],
  edit: ["Edit", UI.Style.TEXT_SUCCESS_BOLD],
  glob: ["Glob", UI.Style.TEXT_INFO_BOLD],
  grep: ["Grep", UI.Style.TEXT_INFO_BOLD],
  list: ["List", UI.Style.TEXT_INFO_BOLD],
  read: ["Read", UI.Style.TEXT_HIGHLIGHT_BOLD],
  write: ["Write", UI.Style.TEXT_SUCCESS_BOLD],
  websearch: ["Search", UI.Style.TEXT_DIM_BOLD],
}

export const RunCommand = cmd({
  command: "run [message..]",
  describe: "run opencode with a message",
  builder: (yargs: Argv) => {
    return yargs
      .positional("message", {
        describe: "message to send",
        type: "string",
        array: true,
        default: [],
      })
      .option("continue", {
        alias: ["c"],
        describe: "continue the last session",
        type: "boolean",
      })
      .option("session", {
        alias: ["s"],
        describe: "session id to continue",
        type: "string",
      })
      .option("share", {
        type: "boolean",
        describe: "share the session",
      })
      .option("model", {
        type: "string",
        alias: ["m"],
        describe: "model to use in the format of provider/model",
      })
      .option("agent", {
        type: "string",
        describe: "agent to use",
      })
      .option("file", {
        type: "string",
        alias: ["f"],
        describe: "read message from file (defaults to 'agent-instruction.txt')",
      })
      .option("batch", {
        type: "boolean",
        alias: ["b"],
        describe: "run in batch mode (non-interactive, minimal output)",
        default: true,
      })
  },
  handler: async (args) => {
    let message = args.message.join(" ")

    // Handle file input
    const defaultFile = "agent-instruction.txt"
    const inputFile = args.file || (existsSync(defaultFile) ? defaultFile : null)
    
    if (inputFile) {
      if (!existsSync(inputFile)) {
        UI.error(`File not found: ${inputFile}`)
        return
      }
      const fileContent = readFileSync(inputFile, "utf-8")
      message = message ? `${message}\n\n${fileContent}` : fileContent
    } else if (!process.stdin.isTTY) {
      message += "\n" + (await Bun.stdin.text())
    }

    if (!message.trim()) {
      UI.error("No message provided. Use arguments, stdin, or --file option.")
      return
    }

    await bootstrap({ cwd: process.cwd() }, async () => {
      const session = await (async () => {
        if (args.continue) {
          const list = Session.list()
          const first = await list.next()
          await list.return()
          if (first.done) return
          return first.value
        }

        if (args.session) return Session.get(args.session)

        return Session.create()
      })()

      if (!session) {
        UI.error("Session not found")
        return
      }

      const cfg = await Config.get()
      if (cfg.share === "auto" || Flag.OPENCODE_AUTO_SHARE || args.share) {
        try {
          await Session.share(session.id)
          UI.println(UI.Style.TEXT_INFO_BOLD + "~  https://opencode.ai/s/" + session.id.slice(-8))
        } catch (error) {
          if (error instanceof Error && error.message.includes("disabled")) {
            UI.println(UI.Style.TEXT_DANGER_BOLD + "!  " + error.message)
          } else {
            throw error
          }
        }
      }

      const agent = await (async () => {
        if (args.agent) return Agent.get(args.agent)
        const build = Agent.get("build")
        if (build) return build
        return Agent.list().then((x) => x[0])
      })()

      const { providerID, modelID } = await (() => {
        if (args.model) return Provider.parseModel(args.model)
        if (agent.model) return agent.model
        return Provider.defaultModel()
      })()

      function printEvent(color: string, type: string, title: string) {
        UI.println(
          color + `|`,
          UI.Style.TEXT_NORMAL + UI.Style.TEXT_DIM + ` ${type.padEnd(7, " ")}`,
          "",
          UI.Style.TEXT_NORMAL + title,
        )
      }

      let text = ""
      let errorMsg: string | undefined

      // Only set up interactive UI in non-batch mode
      if (!args.batch) {
        Bus.subscribe(MessageV2.Event.PartUpdated, async (evt) => {
          if (evt.properties.part.sessionID !== session.id) return
          if (evt.properties.part.messageID === messageID) return
          const part = evt.properties.part

          if (part.type === "tool" && part.state.status === "completed") {
            const [tool, color] = TOOL[part.tool] ?? [part.tool, UI.Style.TEXT_INFO_BOLD]
            const title =
              part.state.title ||
              (Object.keys(part.state.input).length > 0 ? JSON.stringify(part.state.input) : "Unknown")
            printEvent(color, tool, title)
          }

          if (part.type === "text") {
            text = part.text

            if (part.time?.end) {
              UI.empty()
              UI.println(UI.markdown(text))
              UI.empty()
              text = ""
              return
            }
          }
        })

        Bus.subscribe(Session.Event.Error, async (evt) => {
          const { sessionID, error } = evt.properties
          if (sessionID !== session.id || !error) return
          const err_obj = error as any
          let err = String(err_obj.name)

          if ("data" in err_obj && err_obj.data && "message" in err_obj.data) {
            err = err_obj.data.message
          }
          errorMsg = errorMsg ? errorMsg + "\n" + err : err

          UI.error(err)
        })
      } else {
        // In batch mode, collect errors silently
        Bus.subscribe(Session.Event.Error, async (evt) => {
          const { sessionID, error } = evt.properties
          if (sessionID !== session.id || !error) return
          const err_obj = error as any
          let err = String(err_obj.name)

          if ("data" in err_obj && err_obj.data && "message" in err_obj.data) {
            err = err_obj.data.message
          }
          errorMsg = errorMsg ? errorMsg + "\n" + err : err
        })
      }

      const messageID = Identifier.ascending("message")
      const result = await Session.chat({
        sessionID: session.id,
        messageID,
        ...(agent.model
          ? agent.model
          : {
              providerID,
              modelID,
            }),
        agent: agent.name,
        parts: [
          {
            id: Identifier.ascending("part"),
            type: "text",
            text: message,
          },
        ],
      })

      // Handle output based on mode
      const isPiped = !process.stdout.isTTY
      if (args.batch || isPiped) {
        const match = result.parts.findLast((x) => x.type === "text")
        if (match) {
          console.log(match.text)
        }
        if (errorMsg) {
          console.error(errorMsg)
        }
      } else {
        UI.empty()
      }
    })
  },
})
