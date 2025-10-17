/**
 * @typedef {Object} SummarySection
 * @property {string=} heading
 * @property {string[]=} bullets
 * @property {string[]=} paragraphs
 */

/**
 * @typedef {Object} SummaryJson
 * @property {string=} title
 * @property {string[]=} paragraphs
 * @property {string[]=} bullets
 * @property {SummarySection[]=} sections
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} question
 * @property {string} answer
 * @property {'easy'|'medium'|'hard'} difficulty
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {Date} timestamp
 */

/**
 * @typedef {Object} Video
 * @property {string} id
 * @property {string} youtubeUrl
 * @property {string} videoId
 * @property {string} title
 * @property {string} thumbnailUrl
 * @property {string} transcript
 * @property {string|SummaryJson} summary
 * @property {{id:string,text:string}[]} keyPoints
 */

export {};
