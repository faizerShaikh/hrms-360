import axios from "axios";

const getImage = async (url: string) => {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "arraybuffer",
      headers: { "Accept": "*/*", "Content-Type": "*/*" },
    });
    let image = btoa(
      new Uint8Array(response.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    return `data:${response.headers[
      "content-type"
    ].toLowerCase()};base64,${image}`;
  } catch (error) {
    return null;
  }
};

export default getImage;
