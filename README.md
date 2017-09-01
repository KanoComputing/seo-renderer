# SEO Renderer

Inspired by Google's Rendertron, it is a lighter version with a caching DynamoDB caching layer.

Requires Node 7+

## API

While running using `npm start` a server will start with one `/render/*` endpoint.

Add the url to the website you want to serialise like so `/render/https://world.kano.me/share/sunny-day`

In the configuration file, you can add extra parameters that will be added if the host matches. This is useful to let know the page that it's being rendered for a robot or to enable shadyDOM.

e.g.

```json
{
    ...,
    "extraParams": {
        "apps.kano.me": {
            "dom": "shady"
        }
    }
}

```

This will add `dom=shady` to the requested url


## Caching

If `caching` is set to enabled in the configuration, the rendered pages will be cached for a day after their first hit using AWS's DynamoDB


## Contribute

### Installation

Clone this repository then install the dependencies with

```sh
npm install
```

### Running

```sh
npm start
```

### Tests

Run tests with

```sh
npm test
```
