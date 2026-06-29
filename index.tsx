import { createServerFn } from "@tanstack/react-start";

type TiktokResult = {
  author: string;
  desc: string;
  cover: string;
  videoUrl: string | null;
  hdVideoUrl: string | null;
  musicUrl: string | null;
};

const fixUrl = (link: string | null | undefined): string | null => {
  if (!link) return null;
  if (link.startsWith("//")) return `https:${link}`;
  if (link.startsWith("/")) return `https://www.tikwm.com${link}`;
  return link;
};

async function tryTikWM(videoUrl: string): Promise<TiktokResult | null> {
  try {
    const response = await fetch(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&web=1&hd=1`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!response.ok) return null;
    const json: any = await response.json();
    if (json.code === 0 && json.data) {
      return {
        author: json.data.author?.nickname || "@usuario",
        desc: json.data.title || "Sem descrição",
        cover: fixUrl(json.data.cover) || "",
        videoUrl: fixUrl(json.data.play),
        hdVideoUrl: fixUrl(json.data.hdplay),
        musicUrl: fixUrl(json.data.music),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryRapidAPI(videoUrl: string): Promise<TiktokResult | null> {
  try {
    const response = await fetch(
      `https://tiktok-video-downloader-api.p.rapidapi.com/media?video_url=${encodeURIComponent(videoUrl)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": "62d2d6e37amshdcd22f1438ca3f8p1c6826jsn00497357332f",
          "x-rapidapi-host": "tiktok-video-downloader-api.p.rapidapi.com",
        },
      },
    );
    if (!response.ok) return null;
    const data: any = await response.json();
    const v = data.data || data;
    if (!v) return null;
    return {
      author: v.author || v.uploader || "@usuario",
      desc: v.title || v.description || "",
      cover: v.cover || v.thumbnail || "",
      videoUrl: v.url || v.nwm_video_url || v.play || null,
      hdVideoUrl: v.hdplay || v.hd_play || v.nwm_video_url_HQ || null,
      musicUrl: v.music || v.music_url || v.audio_url || null,
    };
  } catch {
    return null;
  }
}

export const resolveTiktok = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input?.url || typeof input.url !== "string") {
      throw new Error("URL inválida");
    }
    return input;
  })
  .handler(async ({ data }): Promise<TiktokResult> => {
    const r1 = await tryTikWM(data.url);
    if (r1) return r1;
    const r2 = await tryRapidAPI(data.url);
    if (r2) return r2;
    throw new Error("Nenhuma API conseguiu processar o vídeo.");
  });

export const proxyDownload = createServerFn({ method: "GET" })
  .inputValidator((input: { url: string }) => {
    if (!input?.url || !/^https?:\/\//.test(input.url)) {
      throw new Error("URL inválida");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const res = await fetch(data.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.tiktok.com/",
      },
    });
    if (!res.ok) throw new Error(`Falha ao baixar (${res.status})`);
    const buf = await res.arrayBuffer();
    const b64 =
      typeof Buffer !== "undefined"
        ? Buffer.from(buf).toString("base64")
        : btoa(String.fromCharCode(...new Uint8Array(buf)));
    return {
      base64: b64,
      contentType: res.headers.get("content-type") || "video/mp4",
    };
  });
