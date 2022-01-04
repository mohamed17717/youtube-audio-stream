class SelectorHandler {
  // contain selectors
  prefix = ".root";

  audioContainer = `${this.prefix} .audio`;
  errorContainer = `${this.prefix} .error`;

  form = `${this.prefix} form`;
  submitFormButton = `${this.form} button`;

  backgroundHeroImage = `${this.prefix}`;
}

class StorageHandler {
  getVideoId(video_url) {
    const id =
      new URL(video_url).searchParams.get("v") || video_url.split("/").pop();

    return id;
  }

  saveLocally(video_info) {
    const { audio_url, videoId } = video_info;
    const expire = parseInt(new URL(audio_url).searchParams.get("expire"));

    sessionStorage.setItem(videoId, JSON.stringify({ ...video_info, expire }));
  }

  checkLocally(video_url) {
    const videoId = this.getVideoId(video_url);
    const stringObj = sessionStorage.getItem(videoId);

    if (stringObj) {
      const video_info = JSON.parse(stringObj);

      if (video_info.expire > new Date().getTime() / 1000) return video_info;
    }
  }
}

class RenderHandler {
  outputAudioContainer = document.querySelector(selectors.audioContainer);
  heroImageElm = document.querySelector(selectors.backgroundHeroImage);

  renderAudio(audio_url) {
    this.outputAudioContainer.innerHTML = `<audio controls autoplay>
      <source src="${audio_url}" type="audio/mpeg">
      Your browser does not support the audio tag.
    </audio>`;
  }

  renderHeroImage(thumbnail_url) {
    this.heroImageElm.style.backgroundImage = `url("${thumbnail_url}")`;
  }
}

class RequestHandler {
  backend = "https://ninja-bag.site/yt/audio/";

  async get(video_url) {
    video_url = video_url.split("&")[0];

    const response = await fetch(this.backend, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_url }),
    });

    return response;
  }
}

class FormHandler {
  // elements
  form = document.querySelector(selectors.form);
  submitButton = document.querySelector(selectors.submitFormButton);
  errorMsgContainer = document.querySelector(selectors.errorContainer);
  outputAudioContainer = document.querySelector(selectors.audioContainer);

  storage = new StorageHandler();

  onSubmitHandle = (e) => {
    e.preventDefault();

    const { video_url } = Object.fromEntries(new FormData(e.target).entries());
    this.lock();
    this.reset();

    const video_info = this.storage.checkLocally(video_url);
    if (video_info) {
      this.success(video_info);
    } else {
      const request = new RequestHandler();

      request
        .get(video_url)
        .then((res) => res.json())
        .then((data) => this.success(data))
        .catch(() => this.fail());
    }
  };

  reset() {
    this.errorMsgContainer.textContent = "";
    this.outputAudioContainer.innerHTML = "";
  }

  lock() {
    this.submitButton.disabled = true;
  }

  unlock() {
    this.submitButton.disabled = false;
  }

  success(data) {
    this.unlock();

    const thumbnail_url = data.thumbnails.reduce((a, b) =>
      a.width > b.width ? a : b
    ).url;

    const render = new RenderHandler();
    render.renderAudio(data.audio_url);
    render.renderHeroImage(thumbnail_url);

    this.storage.saveLocally(data);
  }

  fail() {
    this.unlock();

    this.errorMsgContainer.style.display = "block";
    this.errorMsgContainer.textContent =
      "There is unexpected error happened, maybe youtube has blocked my backend.";
  }

  listen() {
    this.form.addEventListener("submit", this.onSubmitHandle);
  }
}

const selectors = new SelectorHandler();

new FormHandler().listen();

// Register Service worker for Add to Home Screen option to work
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}
