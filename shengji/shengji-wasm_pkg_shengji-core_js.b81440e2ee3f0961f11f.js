"use strict";
(self["webpackChunkshengji"] = self["webpackChunkshengji"] || []).push([["shengji-wasm_pkg_shengji-core_js"],{

/***/ 3411:
/*!******************************************!*\
  !*** ./shengji-wasm/pkg/shengji-core.js ***!
  \******************************************/
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   can_play_cards: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.can_play_cards),
/* harmony export */   compute_deck_len: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.compute_deck_len),
/* harmony export */   compute_score: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.compute_score),
/* harmony export */   decompose_trick_format: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.decompose_trick_format),
/* harmony export */   explain_scoring: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.explain_scoring),
/* harmony export */   find_valid_bids: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.find_valid_bids),
/* harmony export */   find_viable_plays: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.find_viable_plays),
/* harmony export */   get_card_info: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.get_card_info),
/* harmony export */   next_threshold_reachable: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.next_threshold_reachable),
/* harmony export */   sort_and_group_cards: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.sort_and_group_cards),
/* harmony export */   zstd_decompress: () => (/* reexport safe */ _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.zstd_decompress)
/* harmony export */ });
/* harmony import */ var _shengji_core_bg_wasm__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shengji-core_bg.wasm */ 21712);
/* harmony import */ var _shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shengji-core_bg.js */ 79901);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_shengji_core_bg_wasm__WEBPACK_IMPORTED_MODULE_1__]);
_shengji_core_bg_wasm__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];
/* @ts-self-types="./shengji-core.d.ts" */



(0,_shengji_core_bg_js__WEBPACK_IMPORTED_MODULE_0__.__wbg_set_wasm)(_shengji_core_bg_wasm__WEBPACK_IMPORTED_MODULE_1__);
_shengji_core_bg_wasm__WEBPACK_IMPORTED_MODULE_1__.__wbindgen_start();


__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 21712:
/*!***********************************************!*\
  !*** ./shengji-wasm/pkg/shengji-core_bg.wasm ***!
  \***********************************************/
/***/ ((module, exports, __webpack_require__) => {

/* harmony import */ var WEBPACK_IMPORTED_MODULE_0 = __webpack_require__(/*! ./shengji-core_bg.js */ 79901);
module.exports = __webpack_require__.v(exports, module.id, "5ea5645812e8296b7834", {
	"./shengji-core_bg.js": {
		"__wbg_new_227d7c05414eb861": WEBPACK_IMPORTED_MODULE_0.__wbg_new_227d7c05414eb861,
		"__wbg_stack_3b0d974bbf31e44f": WEBPACK_IMPORTED_MODULE_0.__wbg_stack_3b0d974bbf31e44f,
		"__wbg_error_757e9472f8410341": WEBPACK_IMPORTED_MODULE_0.__wbg_error_757e9472f8410341,
		"__wbg_parse_6937a9050adfb0e1": WEBPACK_IMPORTED_MODULE_0.__wbg_parse_6937a9050adfb0e1,
		"__wbg_stringify_54b3d9b61602aee6": WEBPACK_IMPORTED_MODULE_0.__wbg_stringify_54b3d9b61602aee6,
		"__wbg___wbindgen_throw_5d9e815e6fdf150f": WEBPACK_IMPORTED_MODULE_0.__wbg___wbindgen_throw_5d9e815e6fdf150f,
		"__wbg___wbindgen_string_get_92ab86bb19cbc12f": WEBPACK_IMPORTED_MODULE_0.__wbg___wbindgen_string_get_92ab86bb19cbc12f,
		"__wbg___wbindgen_is_undefined_8c687d0b90d5b524": WEBPACK_IMPORTED_MODULE_0.__wbg___wbindgen_is_undefined_8c687d0b90d5b524,
		"__wbindgen_init_externref_table": WEBPACK_IMPORTED_MODULE_0.__wbindgen_init_externref_table,
		"__wbindgen_generic_0000000000000001": WEBPACK_IMPORTED_MODULE_0.__wbindgen_generic_0000000000000001
	}
});

/***/ }),

/***/ 79901:
/*!*********************************************!*\
  !*** ./shengji-wasm/pkg/shengji-core_bg.js ***!
  \*********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   __wbg___wbindgen_is_undefined_8c687d0b90d5b524: () => (/* binding */ __wbg___wbindgen_is_undefined_8c687d0b90d5b524),
/* harmony export */   __wbg___wbindgen_string_get_92ab86bb19cbc12f: () => (/* binding */ __wbg___wbindgen_string_get_92ab86bb19cbc12f),
/* harmony export */   __wbg___wbindgen_throw_5d9e815e6fdf150f: () => (/* binding */ __wbg___wbindgen_throw_5d9e815e6fdf150f),
/* harmony export */   __wbg_error_757e9472f8410341: () => (/* binding */ __wbg_error_757e9472f8410341),
/* harmony export */   __wbg_new_227d7c05414eb861: () => (/* binding */ __wbg_new_227d7c05414eb861),
/* harmony export */   __wbg_parse_6937a9050adfb0e1: () => (/* binding */ __wbg_parse_6937a9050adfb0e1),
/* harmony export */   __wbg_set_wasm: () => (/* binding */ __wbg_set_wasm),
/* harmony export */   __wbg_stack_3b0d974bbf31e44f: () => (/* binding */ __wbg_stack_3b0d974bbf31e44f),
/* harmony export */   __wbg_stringify_54b3d9b61602aee6: () => (/* binding */ __wbg_stringify_54b3d9b61602aee6),
/* harmony export */   __wbindgen_generic_0000000000000001: () => (/* binding */ __wbindgen_generic_0000000000000001),
/* harmony export */   __wbindgen_init_externref_table: () => (/* binding */ __wbindgen_init_externref_table),
/* harmony export */   can_play_cards: () => (/* binding */ can_play_cards),
/* harmony export */   compute_deck_len: () => (/* binding */ compute_deck_len),
/* harmony export */   compute_score: () => (/* binding */ compute_score),
/* harmony export */   decompose_trick_format: () => (/* binding */ decompose_trick_format),
/* harmony export */   explain_scoring: () => (/* binding */ explain_scoring),
/* harmony export */   find_valid_bids: () => (/* binding */ find_valid_bids),
/* harmony export */   find_viable_plays: () => (/* binding */ find_viable_plays),
/* harmony export */   get_card_info: () => (/* binding */ get_card_info),
/* harmony export */   next_threshold_reachable: () => (/* binding */ next_threshold_reachable),
/* harmony export */   sort_and_group_cards: () => (/* binding */ sort_and_group_cards),
/* harmony export */   zstd_decompress: () => (/* binding */ zstd_decompress)
/* harmony export */ });
/**
 * @param {any} req
 * @returns {any}
 */
function can_play_cards(req) {
    const ret = wasm.can_play_cards(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {number}
 */
function compute_deck_len(req) {
    const ret = wasm.compute_deck_len(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] >>> 0;
}

/**
 * @param {any} req
 * @returns {any}
 */
function compute_score(req) {
    const ret = wasm.compute_score(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function decompose_trick_format(req) {
    const ret = wasm.decompose_trick_format(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function explain_scoring(req) {
    const ret = wasm.explain_scoring(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function find_valid_bids(req) {
    const ret = wasm.find_valid_bids(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function find_viable_plays(req) {
    const ret = wasm.find_viable_plays(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function get_card_info(req) {
    const ret = wasm.get_card_info(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function next_threshold_reachable(req) {
    const ret = wasm.next_threshold_reachable(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} req
 * @returns {any}
 */
function sort_and_group_cards(req) {
    const ret = wasm.sort_and_group_cards(req);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {Uint8Array} req
 * @returns {string}
 */
function zstd_decompress(req) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(req, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.zstd_decompress(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
function __wbg___wbindgen_is_undefined_8c687d0b90d5b524(arg0) {
    const ret = arg0 === undefined;
    return ret;
}
function __wbg___wbindgen_string_get_92ab86bb19cbc12f(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg___wbindgen_throw_5d9e815e6fdf150f(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
function __wbg_error_757e9472f8410341(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
}
function __wbg_new_227d7c05414eb861() {
    const ret = new Error();
    return ret;
}
function __wbg_parse_6937a9050adfb0e1() { return handleError(function (arg0, arg1) {
    const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return ret;
}, arguments); }
function __wbg_stack_3b0d974bbf31e44f(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_stringify_54b3d9b61602aee6() { return handleError(function (arg0) {
    const ret = JSON.stringify(arg0);
    return ret;
}, arguments); }
function __wbindgen_generic_0000000000000001(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
}
function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
}
function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


let wasm;
function __wbg_set_wasm(val) {
    wasm = val;
}


/***/ })

}]);
//# sourceMappingURL=shengji-wasm_pkg_shengji-core_js.b81440e2ee3f0961f11f.js.map