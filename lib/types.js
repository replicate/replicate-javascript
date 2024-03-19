/**
 * @typedef {"starting" | "processing" | "succeeded" | "failed" | "canceled"} Status
 * @typedef {"public" | "private"} Visibility
 * @typedef {"start" | "output" | "logs" | "completed"} WebhookEventType
 *
 * @typedef {Object} Account
 * @property {"user" | "organization"} type
 * @property {string} username
 * @property {string} name
 * @property {string=} github_url
 *
 * @typedef {Object} Collection
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {Model[]=} models
 *
 * @typedef {Object} Deployment
 * @property {string} owner
 * @property {string} name
 * @property {object} current_release
 * @property {number} current_release.number
 * @property {string} current_release.model
 * @property {string} current_release.version
 * @property {string} current_release.created_at
 * @property {Account} current_release.created_by
 * @property {object} current_release.configuration
 * @property {string} current_release.configuration.hardware
 * @property {number} current_release.configuration.min_instances
 * @property {number} current_release.configuration.max_instances
 *
 * @typedef {Object} Hardware
 * @property {string} sku
 * @property {string} name
 *
 * @typedef {Object} Model
 * @property {string} url
 * @property {string} owner
 * @property {string} name
 * @property {string=} description
 * @property {Visibility} visibility
 * @property {string=} github_url
 * @property {string=} paper_url
 * @property {string=} license_url
 * @property {number} run_count
 * @property {string=} cover_image_url
 * @property {Prediction=} default_example
 * @property {ModelVersion=} latest_version
 *
 * @typedef {Object} ModelVersion
 * @property {string} id
 * @property {string} created_at
 * @property {string} cog_version
 * @property {string} openapi_schema
 *
 * @typedef {Object} Prediction
 * @property {string} id
 * @property {Status} status
 * @property {string=} model
 * @property {string} version
 * @property {object} input
 * @property {unknown=} output
 * @property {"api" | "web"} source
 * @property {unknown=} error
 * @property {string=} logs
 * @property {{predict_time?: number}=} metrics
 * @property {string=} webhook
 * @property {WebhookEventType[]=} webhook_events_filter
 * @property {string} created_at
 * @property {string=} started_at
 * @property {string=} completed_at
 * @property {{get: string; cancel: string; stream?: string}} urls
 *
 * @typedef {Prediction} Training
 *
 * @typedef {Object} ServerSentEvent
 * @property {string} event
 * @property {string} data
 * @property {string=} id
 * @property {number=} retry
 */

/**
 * @template T
 * @typedef {Object} Page
 * @property {string=} previous
 * @property {string=} next
 * @property {T[]} results
 */

module.exports = {};
