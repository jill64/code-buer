"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// action/src/index.ts
var import_action = require("octoflare/action");

// action/src/listener/onIssue.ts
var onIssue = async ({
  event,
  repo,
  owner
}) => {
  console.log("Issue Edit Event", {
    repo,
    owner,
    event
  });
};

// action/src/action/generateSanctuaryContents.ts
var import_attempt2 = require("@jill64/attempt");
var import_promises = require("node:fs/promises");
var import_typescanner = require("typescanner");

// action/src/buer/request.ts
var import_config = require("dotenv/config");
var import_openai = __toESM(require("openai"), 1);

// action/src/util/countToken.ts
var import_js_tiktoken = require("js-tiktoken");
var enc = (0, import_js_tiktoken.getEncoding)((0, import_js_tiktoken.getEncodingNameForModel)("gpt-4"));
var countToken = (messages) => enc.encode(
  typeof messages === "string" ? messages : messages.map((m) => m.type === "text" ? m.text : m.image_url).join("\n")
).length;

// action/src/buer/request.ts
var openai = new import_openai.default({
  apiKey: process.env.OPENAI_API_KEY
});
var request = async (messages, options) => {
  console.log(messages);
  const {
    choices: [{ message, finish_reason }],
    usage,
    model
  } = await openai.chat.completions.create({
    messages,
    model: "gpt-4-turbo-preview",
    temperature: 0.2,
    response_format: {
      type: "json_object"
    },
    ...options
  });
  console.log(message, finish_reason, usage, model);
  const used_tokens = usage?.total_tokens ?? messages.reduce((prev, curr) => prev + countToken(curr.content ?? ""), 0) + countToken(message.content ?? "");
  const max_token = 128e3;
  const remain_tokens = max_token - used_tokens;
  return {
    message,
    finish_reason,
    remain_tokens,
    max_token
  };
};

// action/src/buer/conversation.ts
var normalize = (content, role = "user") => typeof content === "string" ? [{ role, content }] : content;
var conversation = async (intro, iterate, options) => {
  const { max_turns = 10 } = options ?? {};
  const messages = normalize(intro);
  for (const _ of new Array(max_turns).keys()) {
    const response = await request(messages);
    if (response.finish_reason === "length") {
      throw new Error("Conversation Length Exceeded");
    }
    if (!response.message.content) {
      throw new Error("No Reply Content");
    }
    const next = await iterate(response.message.content);
    messages.push(response.message);
    if (!next) {
      console.log("End of Conversation");
      return messages;
    }
    messages.push({ role: "user", content: next });
  }
  throw new Error("Conversation Turn Limit Exceeded");
};

// action/src/util/makeFileTree.ts
var import_exec = __toESM(require("@actions/exec"), 1);
var import_path_minifier = require("path-minifier");
var makeFileTree = async () => {
  const { stdout: file_list } = await import_exec.default.getExecOutput("git ls-files");
  return (0, import_path_minifier.minify)(file_list.split("\n"));
};

// action/src/util/pickJson.ts
var import_attempt = require("@jill64/attempt");
var pickJson = (str, guard) => {
  const response = (0, import_attempt.attempt)(() => {
    const json = JSON.parse(str);
    return guard(json) ? json : null;
  }, null);
  return response;
};

// action/src/action/generateSanctuaryContents.ts
var giveFileContents = async (path) => {
  const str = await (0, import_promises.readFile)(path, "utf-8");
  const token = (0, import_attempt2.attempt)(() => countToken(str), Infinity);
  const ext = path.split(".").pop();
  const name = path.split("/").pop();
  if (token > 6e5) {
    return `${name}.${ext} is cannot provide information because the file size is too large. 
Please do not request data for this file again.`;
  }
  return `
\`\`\`${ext}:${name}
${str}
\`\`\`
`;
};
var generateSanctuaryContents = async () => {
  const file_list = await makeFileTree();
  const intro = `Find the problem with your project based on the following items

- Performance
- Reliability
- Maintenance
- Security
- Documentation

Please observe the following rules when creating it.

- If you want to know the contents of the file, reply with the path to the file you need in the form of a JSON array.
- Keep requesting the contents of the file until you have all the information you need.
- Please do not request the same file more than once.

Example of a file request:
\`\`\`json
{
  "type": "file_request",
  "files": ["src/index.js", "README.md"]
}
\`\`\`

The following is a list of project files.

\`\`\`
${file_list}
\`\`\`

Once a sufficient number of issues have been extracted, output the list in markdown format according to the following JSON format.
\`\`\`json
{
  "type": "summary",
  "content": "# Detected Project Issues
## Performance
- [ ] Issue 1
- [ ] Issue 2
- [ ] Issue 3
..."
}
\`\`\`
`;
  const result = await conversation(intro, async (reply) => {
    const list = pickJson(
      reply,
      (0, import_typescanner.scanner)({
        type: (0, import_typescanner.list)(["file_request"]),
        files: (0, import_typescanner.array)(import_typescanner.string)
      })
    );
    if (!list) {
      const response = pickJson(
        reply,
        (0, import_typescanner.scanner)({
          type: (0, import_typescanner.list)(["summary"]),
          content: import_typescanner.string
        })
      );
      if (!response) {
        throw new Error("No Summary");
      }
      return;
    }
    const files = await Promise.all(list.files.map(giveFileContents));
    return files.join("\n");
  });
  const last = result.pop();
  if (last?.role !== "assistant" || !last?.content) {
    throw new Error("No Result from Conversation");
  }
  const { content } = pickJson(
    last.content,
    (0, import_typescanner.scanner)({
      type: (0, import_typescanner.list)(["summary"]),
      content: import_typescanner.string
    })
  ) ?? {};
  if (!content) {
    throw new Error("No Summary");
  }
  return content;
};

// action/src/listener/onPush.ts
var onPush = async ({
  octokit,
  repo,
  owner
}) => {
  const { data: list } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    creator: "code-buer[bot]"
  });
  const body = await generateSanctuaryContents();
  const sanctuary = list.find((issue) => issue.title === "Sanctuary");
  if (!sanctuary) {
    await octokit.rest.issues.create({
      owner,
      repo,
      title: "Sanctuary",
      body,
      labels: ["dashboard"]
    });
    return;
  }
  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: sanctuary.number,
    body
  });
};

// action/src/index.ts
(0, import_action.action)(
  async ({ payload: { repo, owner, data: event }, octokit }) => {
    if (event.type === "push") {
      await onPush({ octokit, event, repo, owner });
      return;
    }
    if (event.type === "issue") {
      await onIssue({ octokit, event, repo, owner });
      return;
    }
    console.log("No Triggered Event");
  }
);
