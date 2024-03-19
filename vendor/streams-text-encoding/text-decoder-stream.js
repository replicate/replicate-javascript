// Adapted from https://github.com/stardazed/sd-streams
//
// MIT License
//
// Copyright (c) 2018-Present @zenmumbler
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// /input.ts
var input_exports = {};
__export(input_exports, {
  TextDecoderStream: () => TextDecoderStream
});
module.exports = __toCommonJS(input_exports);

// http-url:https://unpkg.com/@stardazed/streams-text-encoding@1.0.2/dist/sd-streams-text-encoding.esm.js
var decDecoder = Symbol("decDecoder");
var decTransform = Symbol("decTransform");
var TextDecodeTransformer = class {
  constructor(decoder) {
    this.decoder_ = decoder;
  }
  transform(chunk, controller) {
    if (!(chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk))) {
      throw new TypeError("Input data must be a BufferSource");
    }
    const text = this.decoder_.decode(chunk, { stream: true });
    if (text.length !== 0) {
      controller.enqueue(text);
    }
  }
  flush(controller) {
    const text = this.decoder_.decode();
    if (text.length !== 0) {
      controller.enqueue(text);
    }
  }
};
var TextDecoderStream = class {
  constructor(label, options) {
    const decoder = new TextDecoder(label || "utf-8", options || {});
    this[decDecoder] = decoder;
    this[decTransform] = new TransformStream(new TextDecodeTransformer(decoder));
  }
  get encoding() {
    return this[decDecoder].encoding;
  }
  get fatal() {
    return this[decDecoder].fatal;
  }
  get ignoreBOM() {
    return this[decDecoder].ignoreBOM;
  }
  get readable() {
    return this[decTransform].readable;
  }
  get writable() {
    return this[decTransform].writable;
  }
};
var encEncoder = Symbol("encEncoder");
var encTransform = Symbol("encTransform");
