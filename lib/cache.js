/*
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB();

let config = {};

class Cache {
    configure (c) {
        config = c;
        AWS.config.update({
            region: config.region,
            endpoint: config.endpoint
        });
    }
    async clearCache() {
        // const query = datastore.createQuery('Page');
        // const data = await datastore.runQuery(query);
        // const entities = data[0];
        // const entityKeys = entities.map((entity) => entity[datastore.KEY]);
        // console.log(`Removing ${entities.length} items from the cache`);
        // await datastore.delete(entityKeys);
        // TODO(samli): check info (data[1]) and loop through pages of entities to delete.
    }

    async cacheContent(key, headers, payload) {
        const docClient = new AWS.DynamoDB.DocumentClient();
        // Set cache length to 1 day.
        const cacheDurationMinutes = 60 * 24;
        const now = new Date();
        const params = {
            TableName: config.table,
            Item: {
                url: key,
                saved: now.getTime(),
                expires: (new Date(now.getTime() + cacheDurationMinutes * 60 * 1000)).getTime(),
                headers: JSON.stringify(headers),
                payload: JSON.stringify(payload)
            }
        };
        await docClient.put(params).promise();
    }

    /**
     * Returns middleware function.
     * @return {function}
     */
    middleware() {
        return async function (request, response, next) {
            function accumulateContent(content) {
                if (typeof (content) === 'string') {
                    body = body || '' + content;
                } else if (Buffer.isBuffer(content)) {
                    if (!body)
                        body = new Buffer(0);
                    body = Buffer.concat([body, content], body.length + content.length);
                }
            }

            // Cache based on full URL. This means requests with different params are
            // cached separately.
            const key = request.targetUrl;
            const docClient = new AWS.DynamoDB.DocumentClient();
            const result = await docClient.get({
                TableName: config.table,
                Key: {
                    url: key
                }
            }).promise();

            if (result && result.Item) {
                const item = result.Item;
                // Serve cached content if its not expired.
                if (item.expires >= Date.now()) {
                    const headers = JSON.parse(item.headers);
                    response.set(headers);
                    let payload = JSON.parse(item.payload);
                    payload = new Buffer(payload);
                    response.send(payload);
                    return;
                } else {
                    const docClientDelete = new AWS.DynamoDB.DocumentClient();
                    await docClientDelete.delete({
                        TableName: config.table,
                        Key: {
                            url: key
                        }
                    }).promise();
                }
            }

            // Capture output to cache.
            const methods = {
                write: response.write,
                end: response.end,
            };
            let body = null;

            response.write = function (content, ...args) {
                accumulateContent(content);
                return methods.write.apply(response, [content].concat(args));
            };

            response.end = async function (content, ...args) {
                if (response.statusCode == 200) {
                    accumulateContent(content);
                    await this.cacheContent(key, response.getHeaders(), body);
                }
                return methods.end.apply(response, [content].concat(args));
            }.bind(this);

            next();
        }.bind(this);
    }
}

// TODO(samli): Allow for caching options, like freshness options.
module.exports = new Cache();