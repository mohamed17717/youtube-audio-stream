class YoutubeAudio_StorageManager {
  getVideoId(video_url) {
    const id =
      new URL(video_url).searchParams.get("v") || video_url.split("/").pop();

    return id;
  }

  saveLocally({ video_url, audio_url }) {
    const expire = parseInt(new URL(audio_url).searchParams.get("expire"));
    const videoId = this.getVideoId(video_url);

    const obj = { audio_url, expire };

    sessionStorage.setItem(videoId, JSON.stringify(obj));
  }

  checkLocally(video_url) {
    const videoId = this.getVideoId(video_url);
    const stringObj = sessionStorage.getItem(videoId);

    if (stringObj) {
      const { audio_url, expire } = JSON.parse(stringObj);
      if (expire > new Date().getTime() / 1000) return audio_url;
    }
  }
}

class YoutubeAudio extends YoutubeAudio_StorageManager {
  backend = "https://ninja-bag.site/yt/audio/";

  constructor({ video_url }, callback) {
    super();

    this.video_url = video_url;
    this.callback = callback;

    const audio_url = this.checkLocally(video_url);
    audio_url ? this.render(audio_url) : this.get();
  }

  generateRequestBody() {
    const video_url = this.video_url;
    return { video_url };
  }

  generateRequestHeader() {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  raiseError() {
    document.querySelector(".root .error").textContent =
      "There is unexpected error happened";
  }

  async get() {
    const response = await fetch(this.backend, {
      method: "POST",
      headers: this.generateRequestHeader(),
      body: JSON.stringify(this.generateRequestBody()),
    });

    const status = response.status;
    if (status === 200) {
      const { audio_url } = await response.json();
      this.render(audio_url);
      this.saveLocally({ video_url: this.video_url, audio_url });
      this.callback();
    } else {
      this.raiseError();
      this.callback();
    }
  }

  render(audio_url) {
    console.log(audio_url);

    const elm = document.querySelector(".root .audio");
    elm.innerHTML = `<audio controls autoplay>
      <source src="${audio_url}" type="audio/mpeg">
      Your browser does not support the audio tag.
    </audio>`;
  }
}

const form = document.querySelector("form");
const submitButton = form.querySelector('input[type="submit"]');

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target).entries());
  console.log(data);

  new YoutubeAudio(data, () => (submitButton.disabled = false));
  submitButton.disabled = true;
  document.querySelector(".root .error").textContent = "";
});
