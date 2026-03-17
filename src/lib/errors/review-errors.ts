export enum ReviewSubmissionErrorCode {
  Unauthorized = "UNAUTHORIZED",
  DuplicateReview = "DUPLICATE_REVIEW",
  ReviewTooShort = "REVIEW_TOO_SHORT",
  InvalidProductId = "INVALID_PRODUCT_ID",
}

export class ReviewSubmissionError extends Error {
  readonly code: ReviewSubmissionErrorCode;

  constructor(code: ReviewSubmissionErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "ReviewSubmissionError";
  }
}

export const getReviewSubmissionErrorCode = (error: unknown): ReviewSubmissionErrorCode | undefined => {
  if (error instanceof ReviewSubmissionError) return error.code;
  if (error instanceof Error) {
    const maybeCode = Object.values(ReviewSubmissionErrorCode).includes(error.message as ReviewSubmissionErrorCode)
      ? (error.message as ReviewSubmissionErrorCode)
      : undefined;
    if (maybeCode) return maybeCode;
  }
  return undefined;
};
