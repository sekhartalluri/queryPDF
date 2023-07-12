import Image from "next/image";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useCallback, useState } from "react";
import { Inter } from "next/font/google";
import { isAwaitKeyword } from "typescript";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [res, setRes] = useState("");
  const onDrop = useCallback(async (acceptedFiles: any) => {
    console.log(acceptedFiles);
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
    };
    setRes("uploading file...");
    const status = await axios.post("/api/savePDF", formData);
    setRes("converting to text...");
    const data = await axios.post("/api/PDFtoText");
    setRes("done");
    await axios.post("/api/storeIndex", data);
  }, []);

  const submitQuery = async (query: string) => {
    const ans = await axios.post("/api/getanswer", { query: query });
    console.log("ans", ans.data.ans);
    setAnswer(ans.data.ans);
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  // console.log("q", query);
  return (
    <main className="h-screen">
      <div className={inter.className}>
        <div className="bg-purple-700 py-10">
          <h1 className="text-3xl text-center text-white">Chat with PDF</h1>
        </div>
        <div className="max-w-[800px] mt-10 mx-auto">
          <div
            {...getRootProps({ outline: "none", refKey: "inner" })}
            className="border-dashed border-2 p-10 mx-4 cursor-pointer flex justify-center rounded-xl mb-2"
          >
            <div className="border-2 p-3 rounded-xl">Upload</div>
            <input {...getInputProps()} />
          </div>
          <div className="flex justify-center">{res}</div>
          {/* <div
            contentEditable
            className="w-[80%] h-10 rounded-xl mx-auto bg-white focus:outline-none border-2"
          ></div> */}
          <div className="flex-col">
            <div className="flex justify-center my-10">
              <input
                className="border-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => submitQuery(query)}
                className="h-10 bg-slate-200 ml-2 p-2 rounded-md"
              >
                {" "}
                click
              </button>
            </div>
            <p>{answer}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
