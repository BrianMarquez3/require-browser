// @flow
const { Module } = require("commonjs-standalone");
const delegate = require("./delegate");

const cache = {};
const mod = new Module(__SERVER_SETTINGS__.rootModuleId, delegate, cache);

window.require = mod.env().require;

window.global = window;

window.process = {
  cwd() {
    return __SERVER_SETTINGS__.requireRootDir;
  },
  platform: __SERVER_SETTINGS__.platform,
  env: __SERVER_SETTINGS__.env
};
