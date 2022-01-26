# WBR - Web Browser Robot 🤖🔮

<h1 align="center">
    <img src="./docs/static/img/logo.svg"/>
</h1>

**Web Browser Robot** is a one-stop shop for creating, running and managing **web crawlers** and **automated web tasks** _with ease_.

[![NPM](https://img.shields.io/npm/v/@wbr-project/wbr-interpret?logo=npm)](https://www.npmjs.com/package/@wbr-project/wbr-interpret)
[![Typescript](https://img.shields.io/npm/types/@wbr-project/wbr-interpret?logo=typescript&)](https://www.npmjs.com/package/@wbr-project/wbr-interpret)
[![Code style](https://img.shields.io/static/v1?label=Code%20style&message=Airbnb&color=salmon&logo=airbnb&)](https://github.com/airbnb/javascript)
[![ESLint](https://img.shields.io/github/workflow/status/barjin/wbr/ESLint?label=ESLint&logo=eslint&)](https://github.com/barjin/wbr/actions/workflows/eslint-linter.yml)
[![Jest tests](https://img.shields.io/github/workflow/status/barjin/wbr/Jest%20Tests?label=Tests&logo=jest&)](https://github.com/barjin/wbr/actions/workflows/jest-tests.yml)
[![MIT License](https://img.shields.io/github/license/barjin/wbr?)](https://choosealicense.com/licenses/mit/)
___

## Web Browser Robot

Forget everything you know about tedious asynchronous programming in Playwright or Puppeteer and focus on what you really want to achieve instead. Using an intuitive **if-this-then-that** schema, optimized concurrency with zero run conditions and state-of-art backend technology, creating crawlers and automations has never been easier.

## How easy it is?
Creating _lightning fast web automations_ with WBR is easier than you think. Consider the following snippet:
```javascript
[{
    where: {
        url: "https://wikipedia.org"
    },
    what: [
        {
            type: "scrape",
        }
    ]
}]
```
This code snippet is a 100% valid WBR workflow definition. What does it do? **It scrapes `https://wikipedia.org`**.

You see that with WBR, even a complete beginner can start scraping and crawling in no time. Still not sure? See the [docs](./docs/) and read for yourself, how you can create your first scraper/crawler/automation with WBR.

## Legal 

Made in collaboration with [Apify](https://apify.com/) and [MFF UK](https://mff.cuni.cz), 2021.
