import type { NextApiRequest, NextApiResponse } from "next";
import * as PDFJS from "pdfjs-dist/legacy/build/pdf";
import fs from "fs";
import { OpenAIApi, Configuration } from "openai";
import { PineconeClient } from "@pinecone-database/pinecone";

type Data = {
  text: string;
};

const getVectors = async (
  inputBatch: RegExpMatchArray | null,
  openai: { createEmbedding: (arg0: { model: string; input: any }) => any },
  idx: number
) => {
  let embeddings: any[] = [];
  // return Promise.all(
  //   (inputBatch ?? []).map(async (input, idx) => {
  //     const embeddingResult = await openai.createEmbedding({
  //       model: "text-embedding-ada-002",
  //       input: input,
  //     });

  //     embeddings.push(
  //       embeddingResult.data.data.map(
  //         (entry: { embedding: any }) => entry.embedding
  //       )
  //     );
  //     return {
  //       id: `${idx}`,
  //       metadata: { text: input },
  //       values: embeddingResult.data.data.map(
  //         (entry: { embedding: any }) => entry.embedding
  //       ),
  //     };
  //   })
  // );
  const embeddingResult = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: inputBatch,
  });
  return [
    {
      id: `${idx}`,
      metadata: { text: inputBatch },
      values: embeddingResult.data.data.map(
        (entry: { embedding: any }) => entry.embedding
      ),
    },
  ];
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const INPUT_PDF = "./public/file.pdf";

  const data = fs.readFileSync(INPUT_PDF);
  const pdfDoc = await PDFJS.getDocument(data).promise;
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENV as string,
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const index = pinecone.Index("book-index");
  const numPages = pdfDoc.numPages;
  let output = "";
  for (let i = 0; i < numPages; i++) {
    let page = await pdfDoc.getPage(i + 1);
    let textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join("");
    output += text;
    // const inputBatch = text.match(new RegExp(".{1," + 3800 + "}", "g"));
    // console.log(inputBatch?.length);

    // console.log(vectors.length);

    // const upsertResponse = await index.upsert({
    //   upsertRequest: { vectors, namespace: "example-namespace" },
    // });
    // console.log(upsertResponse);
  }

  const inputBatch = output.match(new RegExp(".{1," + 3800 + "}", "g"));

  for (let i = 0; i < inputBatch?.length ?? 0; i++) {
    const vectors = await getVectors(inputBatch[i] ?? "", openai, i);
    const upsertResponse = await index.upsert({
      upsertRequest: {
        vectors,
        namespace: "example-namespace",
      },
    });
    console.log(upsertResponse);
    await delay(20000);
  }
  fs.writeFileSync("output.txt", output);
  res.status(200).json({ text: output });
}
