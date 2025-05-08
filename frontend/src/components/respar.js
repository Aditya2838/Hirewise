import React, { useState } from "react";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:5000/parse", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setParsedData(data);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      {parsedData && <pre>{JSON.stringify(parsedData, null, 2)}</pre>}
    </div>
  );
};

export default ResumeUpload;
