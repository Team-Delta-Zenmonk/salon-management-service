const { WebhookEvent } = require("../models");
const BaseRepository = require("./base.repository");

class WebhookEventRepository extends BaseRepository {
  constructor(payload) {
    super(payload);
  }
}

module.exports = new WebhookEventRepository({ model: WebhookEvent });
