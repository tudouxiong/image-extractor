export class SafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeUrlError";
  }
}

export class FetchPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchPageError";
  }
}
