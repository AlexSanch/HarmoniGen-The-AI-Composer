// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  const result = await new Promise(async (resolve) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(req.body);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    let result = await fetch(
      "http://172.20.0.2:8083/get-file",
      requestOptions
    );
    result = await result.text();
    resolve(result);
  });
  res.status(200).json(result);
}
