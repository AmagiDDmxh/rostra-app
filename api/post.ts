const post = async (url: string, params: any) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${url}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
  .catch(console.log)

  return res
}

export default post