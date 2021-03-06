import Website from "./website";
import Repository from "./repository";
import { v5 as uuidv5 } from 'uuid';

export default class Link {

  uid: string;
  url: string;
  source: string;
  website: Website;
  repository: Repository;

  constructor (url: string, source: string, website?: Website, repository?: Repository) {
    this.uid = null;
    this.url = null
    this.website = website || null;
    this.source = source || null;
    this.repository = repository || null;

    if (url) {
      this.setUrl(url);
    }
  }

  get type () {
    return 'link';
  }

  get icon () {
    if (this.website) {
      return this.website.icon;
    } else {
      return null;
    }
  }

  get image () {
    if (this.website) {
      return this.website.image;
    } else if (this.repository) {
      return this.repository.avatar;
    } else {
      return null;
    }
  }

  get title () {
    if (this.website) {
      return this.website.title;
    } else if (this.repository) {
      return this.repository.name;
    } else {
      return null;
    }
  }

  get screenshot () {
    return this.website ? this.website.screenshot : null
  }

  get websiteName () {
    return this.website ? this.website.name : null;
  }

  get websiteType () {
    return this.website ? this.website.type : null;
  }

  get description () {
    if (this.repository) {
      return this.repository.description;
    } else if (this.website) {
      return this.website.description;
    } else {
      return null;
    }
  }

  get author () {
    if (this.repository) {
      return this.repository.user;
    } else if (this.website) {
      return this.website.author;
    } else {
      return null;
    }
  }

  get tags () {
    if (this.repository) {
      return this.repository.topics;
    } else if (this.website) {
      return this.website.keywords;
    } else {
      return [];
    }
  }

  get emojis () {
    return this.repository ? this.repository.emojis : [];
  }

  static createFromJson (json) {
    const obj = JSON.parse(json);
    // @ts-ignore
    return Object.assign(new Link(), obj);
  }

  setUrl (url) {
    this.url = Website.normalizeUrl(url);
    this.uid = uuidv5(this.url, uuidv5.URL);
  }

}
