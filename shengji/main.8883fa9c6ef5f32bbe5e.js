/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 671:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EngineContext: () => (/* binding */ EngineContext),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6540);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4300);
/* harmony import */ var _WasmContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3701);
/* harmony import */ var _detectWasm__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6649);
/* harmony import */ var _util_cachePrefill__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(2895);
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};





// Helper to make RPC calls to the server
function callRpc(request) {
    return __awaiter(this, void 0, void 0, function () {
        var bodyString, rpcUrl, response, errorText, responseText, result, type, responseData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bodyString = JSON.stringify(request);
                    rpcUrl = (0,_api__WEBPACK_IMPORTED_MODULE_1__/* .apiUrl */ .y0)("/api/rpc");
                    return [4 /*yield*/, fetch(rpcUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: bodyString,
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    errorText = _a.sent();
                    console.error("RPC call failed with status ".concat(response.status, ":"), errorText);
                    console.error("Failed request was:", bodyString);
                    throw new Error("RPC call failed: ".concat(response.statusText));
                case 3: return [4 /*yield*/, response.text()];
                case 4:
                    responseText = _a.sent();
                    try {
                        result = JSON.parse(responseText);
                    }
                    catch (_b) {
                        console.error("Failed to parse JSON response:", responseText);
                        throw new Error("Invalid JSON response from server: ".concat(responseText.substring(0, 100)));
                    }
                    // Check if it's an error response
                    if (result.type === "Error") {
                        throw new Error(result.Error || "Unknown error");
                    }
                    // Since the response uses serde tag="type", the structure is { type: "ResponseType", ...data }
                    // We need to return the whole result minus the type field for most responses
                    // or extract based on the actual response structure
                    if (!result.type) {
                        console.error("Invalid RPC response - missing type field:", result);
                        throw new Error("Invalid RPC response structure");
                    }
                    type = result.type, responseData = __rest(result, ["type"]);
                    // Some responses might be wrapped, others might have the data directly
                    // BatchGetCardInfo should have results directly in responseData
                    return [2 /*return*/, responseData];
            }
        });
    });
}
// Create async versions of each function that can fallback to RPC
var createAsyncFunctions = function (useWasm, wasmModule) {
    if (useWasm && wasmModule) {
        // WASM is available and loaded, use synchronous WASM functions wrapped in promises
        return {
            findViablePlays: function (trump, tractorRequirements, cards) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.find_viable_plays({
                            trump: trump,
                            cards: cards,
                            tractor_requirements: tractorRequirements,
                        }).results];
                });
            }); },
            findValidBids: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.find_valid_bids(req).results];
                });
            }); },
            sortAndGroupCards: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.sort_and_group_cards(req).results];
                });
            }); },
            decomposeTrickFormat: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.decompose_trick_format(req).results];
                });
            }); },
            canPlayCards: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.can_play_cards(req).playable];
                });
            }); },
            explainScoring: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.explain_scoring(req)];
                });
            }); },
            nextThresholdReachable: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    response = wasmModule.next_threshold_reachable(req);
                    return [2 /*return*/, response.reachable];
                });
            }); },
            computeScore: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.compute_score(req)];
                });
            }); },
            computeDeckLen: function (decks) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, wasmModule.compute_deck_len({ decks: decks })];
                });
            }); },
            batchGetCardInfo: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var results;
                return __generator(this, function (_a) {
                    results = req.requests.map(function (r) { return wasmModule.get_card_info(r); });
                    return [2 /*return*/, { results: results }];
                });
            }); },
        };
    }
    else {
        // WASM not available, use RPC calls
        return {
            findViablePlays: function (trump, tractorRequirements, cards) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc({
                                type: "FindViablePlays",
                                trump: trump,
                                tractor_requirements: tractorRequirements,
                                cards: cards,
                            })];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.results];
                    }
                });
            }); },
            findValidBids: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "FindValidBids" }, req))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.results];
                    }
                });
            }); },
            sortAndGroupCards: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "SortAndGroupCards" }, req))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.results];
                    }
                });
            }); },
            decomposeTrickFormat: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "DecomposeTrickFormat" }, req))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.results];
                    }
                });
            }); },
            canPlayCards: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "CanPlayCards" }, req))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.playable];
                    }
                });
            }); },
            explainScoring: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "ExplainScoring" }, req))];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); },
            nextThresholdReachable: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "NextThresholdReachable" }, req))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.reachable];
                    }
                });
            }); },
            computeScore: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "ComputeScore" }, req))];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); },
            computeDeckLen: function (decks) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc({
                                type: "ComputeDeckLen",
                                decks: decks,
                            })];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.length];
                    }
                });
            }); },
            batchGetCardInfo: function (req) { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, callRpc(__assign({ type: "BatchGetCardInfo" }, req))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response];
                    }
                });
            }); },
        };
    }
};
var EngineContext = react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
var WasmOrRpcProvider = function (props) {
    var useWasm = (0,_detectWasm__WEBPACK_IMPORTED_MODULE_4__/* .isWasmAvailable */ .u)();
    var _a = react__WEBPACK_IMPORTED_MODULE_0__.useState(null), wasmModule = _a[0], setWasmModule = _a[1];
    var _b = react__WEBPACK_IMPORTED_MODULE_0__.useState(useWasm), isLoading = _b[0], setIsLoading = _b[1];
    // Load WASM module dynamically if available
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(function () {
        if (useWasm) {
            // Load WASM module dynamically
            __webpack_require__.e(/* import() */ 411).then(__webpack_require__.bind(__webpack_require__, 3411))
                .then(function (module) {
                setWasmModule(module);
                // Set module on window for debugging
                window.shengji = module;
                // WASM module loaded successfully
                setIsLoading(false);
            })
                .catch(function (error) {
                console.error("Failed to load WASM module:", error);
                setIsLoading(false);
            });
        }
        else {
            // Using server-side RPC fallback (no-WASM mode)
            setIsLoading(false);
        }
    }, [useWasm]);
    var engineFuncs = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(function () { return createAsyncFunctions(useWasm, wasmModule); }, [useWasm, wasmModule]);
    // Only provide decodeWireFormat in the synchronous context
    var syncContextValue = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(function () { return ({
        decodeWireFormat: function (req) {
            if (useWasm && wasmModule) {
                return JSON.parse(wasmModule.zstd_decompress(req));
            }
            else {
                // When WASM is not available, messages should already be decompressed
                // by the server, so we can just parse them directly
                var text = new TextDecoder().decode(req);
                return JSON.parse(text);
            }
        },
    }); }, [useWasm, wasmModule]);
    var engineContextValue = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(function () { return (__assign(__assign({}, engineFuncs), { decodeWireFormat: syncContextValue.decodeWireFormat, isUsingWasm: useWasm && wasmModule !== null })); }, [engineFuncs, syncContextValue, useWasm, wasmModule]);
    // Track if initial prefill is complete
    var _c = react__WEBPACK_IMPORTED_MODULE_0__.useState(false), isPrefillComplete = _c[0], setIsPrefillComplete = _c[1];
    // Eagerly prefill cache for common trump configurations when engine is ready
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(function () {
        if (!isLoading && engineContextValue && !isPrefillComplete) {
            // Engine ready, eagerly prefill card cache for common trumps
            // Create an array of prefill promises
            var prefillPromises = [];
            // Prefill for NoTrump (used in JoinRoom for the joker cards display)
            var noTrumpBasic = { NoTrump: {} };
            prefillPromises.push((0,_util_cachePrefill__WEBPACK_IMPORTED_MODULE_3__/* .prefillCardInfoCache */ .j9)(engineContextValue, noTrumpBasic)
                .then(function () {
                /* Prefilled cache for NoTrump (no rank) */
            })
                .catch(function (error) {
                return console.error("Failed to prefill NoTrump cache:", error);
            }));
            // Also prefill for NoTrump with rank 2 (most common starting rank)
            var noTrump2 = { NoTrump: { number: "2" } };
            prefillPromises.push((0,_util_cachePrefill__WEBPACK_IMPORTED_MODULE_3__/* .prefillCardInfoCache */ .j9)(engineContextValue, noTrump2)
                .then(function () {
                /* Prefilled cache for NoTrump rank 2 */
            })
                .catch(function (error) {
                return console.error("Failed to prefill NoTrump rank 2 cache:", error);
            }));
            // Wait for all prefills to complete before marking as done
            Promise.all(prefillPromises).then(function () {
                setIsPrefillComplete(true);
                // All initial prefills complete
            });
        }
    }, [isLoading, engineContextValue, isPrefillComplete]);
    // Show loading indicator while WASM is being loaded or initial cache is being prefilled
    if (isLoading) {
        return react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null, "Loading game engine...");
    }
    // Optionally wait for prefill to complete before rendering children
    // This prevents the initial cards from making individual requests
    if (!isPrefillComplete) {
        return react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null, "Initializing game data...");
    }
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(EngineContext.Provider, { value: engineContextValue },
        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_WasmContext__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .A.Provider, { value: syncContextValue }, props.children)));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (WasmOrRpcProvider);


/***/ }),

/***/ 2895:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   L9: () => (/* binding */ explainScoringCache),
/* harmony export */   O3: () => (/* binding */ getExplainScoringKey),
/* harmony export */   PU: () => (/* binding */ cardInfoCache),
/* harmony export */   bM: () => (/* binding */ prefillExplainScoringCache),
/* harmony export */   i7: () => (/* binding */ getPrefillPromise),
/* harmony export */   j9: () => (/* binding */ prefillCardInfoCache),
/* harmony export */   us: () => (/* binding */ getTrumpKey)
/* harmony export */ });
/* unused harmony exports isPrefillInProgress, markPrefillStarted */
/* harmony import */ var _preloadedCards__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7236);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

// Cache for card info to avoid repeated async calls
var cardInfoCache = {};
// Cache for explainScoring results
var explainScoringCache = {};
// Track which trumps are currently being prefilled to avoid duplicate requests
var prefillInProgressMap = {};
function isPrefillInProgress(trump) {
    var trumpKey = getTrumpKey(trump);
    return (prefillInProgressMap[trumpKey] !== undefined &&
        prefillInProgressMap[trumpKey] !== null);
}
function markPrefillStarted(trump, promise) {
    var trumpKey = getTrumpKey(trump);
    prefillInProgressMap[trumpKey] = promise;
}
function markPrefillCompleted(trump) {
    var trumpKey = getTrumpKey(trump);
    delete prefillInProgressMap[trumpKey];
}
function getPrefillPromise(trump) {
    var trumpKey = getTrumpKey(trump);
    return prefillInProgressMap[trumpKey] || null;
}
// Helper to create a stable cache key from trump
var getTrumpKey = function (trump) {
    if ("Standard" in trump) {
        return "std_".concat(trump.Standard.suit, "_").concat(trump.Standard.number);
    }
    else if ("NoTrump" in trump) {
        return "nt_".concat(trump.NoTrump.number || "none");
    }
    return "unknown";
};
// Prefill card info cache for all cards with a given trump using batch API
var prefillCardInfoCache = function (engine, trump) { return __awaiter(void 0, void 0, void 0, function () {
    var trumpKey, existingPromise, prefillPromise;
    return __generator(this, function (_a) {
        trumpKey = getTrumpKey(trump);
        existingPromise = getPrefillPromise(trump);
        if (existingPromise) {
            // Prefill already in progress for this trump, return existing promise
            return [2 /*return*/, existingPromise];
        }
        prefillPromise = (function () { return __awaiter(void 0, void 0, void 0, function () {
            var requestsToMake, _i, preloadedCards_1, cardInfo, cacheKey, unknownCacheKey, batchResponse, error_1, _loop_1, _a, requestsToMake_1, _b, card, cacheKey;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        requestsToMake = [];
                        // Get all unique card values from preloadedCards
                        for (_i = 0, preloadedCards_1 = _preloadedCards__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A; _i < preloadedCards_1.length; _i++) {
                            cardInfo = preloadedCards_1[_i];
                            cacheKey = "".concat(cardInfo.value, "_").concat(trumpKey);
                            // Skip if already cached
                            if (cacheKey in cardInfoCache) {
                                continue;
                            }
                            requestsToMake.push({ card: cardInfo.value, cacheKey: cacheKey });
                        }
                        unknownCacheKey = "\uD83C\uDCA0_".concat(trumpKey);
                        if (!(unknownCacheKey in cardInfoCache)) {
                            requestsToMake.push({ card: "🂠", cacheKey: unknownCacheKey });
                        }
                        // If nothing to fetch, return early
                        if (requestsToMake.length === 0) {
                            // Card info cache already filled for this trump
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, engine.batchGetCardInfo({
                                requests: requestsToMake.map(function (r) { return ({
                                    card: r.card,
                                    trump: trump,
                                }); }),
                            })];
                    case 2:
                        batchResponse = _c.sent();
                        // Process batch response
                        // Validate response structure
                        if (!batchResponse ||
                            !batchResponse.results ||
                            !Array.isArray(batchResponse.results)) {
                            throw new Error("Invalid batch response structure: ".concat(JSON.stringify(batchResponse)));
                        }
                        if (batchResponse.results.length !== requestsToMake.length) {
                            console.warn("Response length mismatch: expected ".concat(requestsToMake.length, ", got ").concat(batchResponse.results.length));
                        }
                        // Store results in cache
                        batchResponse.results.forEach(function (info, index) {
                            if (index >= requestsToMake.length) {
                                console.warn("Skipping extra response at index ".concat(index));
                                return;
                            }
                            var cacheKey = requestsToMake[index].cacheKey;
                            cardInfoCache[cacheKey] = info;
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        console.error("❌ Error batch fetching card info:", error_1);
                        console.error("Error details:", error_1 instanceof Error ? error_1.stack : error_1);
                        _loop_1 = function (card, cacheKey) {
                            var cardData = _preloadedCards__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A.find(function (c) { return c.value === card; });
                            cardInfoCache[cacheKey] = {
                                suit: null,
                                effective_suit: "Unknown",
                                value: card,
                                display_value: (cardData === null || cardData === void 0 ? void 0 : cardData.display_value) || card,
                                typ: (cardData === null || cardData === void 0 ? void 0 : cardData.typ) || "unknown",
                                number: (cardData === null || cardData === void 0 ? void 0 : cardData.number) || null,
                                points: (cardData === null || cardData === void 0 ? void 0 : cardData.points) || 0,
                            };
                        };
                        // Fallback to individual requests or static data
                        for (_a = 0, requestsToMake_1 = requestsToMake; _a < requestsToMake_1.length; _a++) {
                            _b = requestsToMake_1[_a], card = _b.card, cacheKey = _b.cacheKey;
                            _loop_1(card, cacheKey);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); })();
        // Store the promise and set up cleanup
        markPrefillStarted(trump, prefillPromise);
        // Clear the in-progress flag when done
        prefillPromise.finally(function () {
            markPrefillCompleted(trump);
        });
        return [2 /*return*/, prefillPromise];
    });
}); };
// Create a cache key for explainScoring requests
var getExplainScoringKey = function (params, smallerLandlordTeamSize, decks) {
    // Create a stable key based on the request parameters
    return JSON.stringify({
        params: params,
        smallerLandlordTeamSize: smallerLandlordTeamSize,
        deckCount: decks.length,
        // We assume deck configuration is the same for a given count
    });
};
// Prefill explainScoring cache
var prefillExplainScoringCache = function (engine, params, decks) { return __awaiter(void 0, void 0, void 0, function () {
    var promises, _loop_2, _i, _a, smallerTeamSize;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                promises = [];
                _loop_2 = function (smallerTeamSize) {
                    var cacheKey = getExplainScoringKey(params, smallerTeamSize, decks);
                    if (cacheKey in explainScoringCache) {
                        return "continue";
                    }
                    var promise = engine
                        .explainScoring({
                        params: params,
                        smaller_landlord_team_size: smallerTeamSize,
                        decks: decks,
                    })
                        .then(function (result) {
                        explainScoringCache[cacheKey] = result;
                    })
                        .catch(function (error) {
                        console.error("Error prefilling explainScoring cache:", error);
                        // Fallback to empty result
                        explainScoringCache[cacheKey] = {
                            results: [],
                            step_size: 10,
                            total_points: 100,
                        };
                    });
                    promises.push(promise);
                };
                // Prefill both regular and bonus scoring
                for (_i = 0, _a = [false, true]; _i < _a.length; _i++) {
                    smallerTeamSize = _a[_i];
                    _loop_2(smallerTeamSize);
                }
                return [4 /*yield*/, Promise.all(promises)];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };


/***/ }),

/***/ 3701:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony export WasmContext */
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6540);

var WasmContext = react__WEBPACK_IMPORTED_MODULE_0__.createContext({
    decodeWireFormat: function (_) {
        throw new Error("cannot decode wire format");
    },
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (WasmContext);


/***/ }),

/***/ 3904:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   P: () => (/* binding */ TimerContext)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6540);
// Provides a WebWorker-based timer implementation which doesn't get
// wakeup-limited by the browser when the tab is running in the background.
//
// Relies on timer-worker.js to service the underlying timing requests.

var TimerContext = react__WEBPACK_IMPORTED_MODULE_0__.createContext({
    setTimeout: function (_fn, _delay) { return 0; },
    clearTimeout: function (_id) { },
    setInterval: function (_fn, _interval) { return 0; },
    clearInterval: function (_id) { },
});
var _TimerProvider = function (props) {
    var _a = react__WEBPACK_IMPORTED_MODULE_0__.useState(null), worker = _a[0], setWorker = _a[1];
    var timeoutId = react__WEBPACK_IMPORTED_MODULE_0__.useRef(0);
    var callbacks = react__WEBPACK_IMPORTED_MODULE_0__.useRef(new Map());
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(function () {
        var timerWorker = new Worker("timer-worker.js");
        timerWorker.addEventListener("message", function (evt) {
            var data = evt.data;
            var id = data.id;
            if (callbacks.current.has(id)) {
                var cb = callbacks.current.get(id);
                if (cb) {
                    cb();
                }
            }
            if (data.variant === "timeout") {
                callbacks.current.delete(id);
            }
        });
        setWorker(timerWorker);
        return function () {
            timerWorker.terminate();
        };
    }, []);
    var setTimeout = function (fn, delay) {
        timeoutId.current += 1;
        delay = delay === undefined ? 0 : delay;
        var id = timeoutId.current;
        callbacks.current.set(id, fn);
        if (worker !== null) {
            worker.postMessage({ command: "setTimeout", id: id, timeout: delay });
        }
        return id;
    };
    var clearTimeout = function (id) {
        if (worker) {
            worker.postMessage({ command: "clearTimeout", id: id });
        }
        callbacks.current.delete(id);
    };
    var setInterval = function (fn, interval) {
        timeoutId.current += 1;
        interval = interval === undefined ? 0 : interval;
        var id = timeoutId.current;
        callbacks.current.set(id, fn);
        if (worker !== null) {
            worker.postMessage({ command: "setInterval", id: id, interval: interval });
        }
        return id;
    };
    var clearInterval = function (id) {
        if (worker !== null) {
            worker.postMessage({ command: "clearInterval", id: id });
        }
        callbacks.current.delete(id);
    };
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(TimerContext.Provider, { value: { setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval } }, props.children));
};
var TimerProvider = function (props) { return react__WEBPACK_IMPORTED_MODULE_0__.createElement(_TimerProvider, null, props.children); };
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (TimerProvider);


/***/ }),

/***/ 4030:
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {


// EXTERNAL MODULE: ./node_modules/react-dom/client.js
var client = __webpack_require__(5338);
// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(6540);
// EXTERNAL MODULE: ./node_modules/react-modal/lib/index.js
var lib = __webpack_require__(312);
var lib_default = /*#__PURE__*/__webpack_require__.n(lib);
;// ./src/util/object.ts
var mapValues = function (object, mapper) {
    var result = {};
    Object.keys(object).forEach(function (k) {
        result[k] = mapper(object[k]);
    });
    return result;
};
var filter = function (object, predicate) {
    var result = {};
    Object.keys(object).forEach(function (key) {
        var value = object[key];
        if (predicate(key, value)) {
            result[key] = value;
        }
    });
    return result;
};
/* harmony default export */ const util_object = ({
    mapValues: mapValues,
    filter: filter,
});

;// ./src/State.ts

var noPersistence = function (loadDefault) {
    return {
        loadDefault: loadDefault,
        persist: function () { },
    };
};
var combineState = function (object) {
    return {
        loadDefault: function () {
            return util_object.mapValues(object, function (p) { return p.loadDefault(); });
        },
        persist: function (before, after) {
            Object.keys(after).forEach(function (k) {
                if (before[k] !== after[k]) {
                    object[k].persist(before[k], after[k]);
                }
            });
        },
    };
};

;// ./src/localStorageState.ts
var localStorageState = function (key, extractor, serializer) {
    return {
        loadDefault: function () { return extractor(window.localStorage.getItem(key)); },
        persist: function (before, after) {
            window.localStorage.setItem(key, serializer(after));
        },
    };
};
var booleanLocalStorageState = function (key, defaultValue) {
    if (defaultValue === void 0) { defaultValue = false; }
    return localStorageState(key, function (value) { return value === "on" || (value == null && defaultValue); }, function (state) { return (state ? "on" : "off"); });
};
var stringLocalStorageState = function (key, defaultValue) {
    if (defaultValue === void 0) { defaultValue = ""; }
    return localStorageState(key, function (value) { return (typeof value === "string" ? value : defaultValue); }, function (state) { return state; });
};
var numberLocalStorageState = function (key, defaultValue) {
    if (defaultValue === void 0) { defaultValue = 0; }
    return localStorageState(key, function (value) {
        return value != null && !isNaN(value) ? parseInt(value, 10) : defaultValue;
    }, function (state) { return state; });
};
var nullableNumberLocalStorageState = function (key, defaultValue) {
    if (defaultValue === void 0) { defaultValue = 0; }
    return localStorageState(key, function (value) {
        return value != null && !isNaN(value) ? parseInt(value, 10) : defaultValue;
    }, function (state) { return state; });
};
function JSONLocalStorageState(key, defaultValue) {
    return localStorageState(key, function (value) {
        try {
            var val = JSON.parse(value);
            if (val !== undefined && val !== null) {
                return val;
            }
            else {
                return defaultValue;
            }
        }
        catch (_a) {
            return defaultValue;
        }
    }, function (state) { return JSON.stringify(state); });
}

;// ./src/state/GameStatistics.ts


var gamesPlayed = numberLocalStorageState("games_played");
var gamesPlayedAsDefending = numberLocalStorageState("games_played_as_defending");
var gamesPlayedAsLandlord = numberLocalStorageState("games_played_as_landlord");
var gamesWon = numberLocalStorageState("games_won");
var gamesWonAsDefending = numberLocalStorageState("games_won_as_defending");
var gamesWonAsLandlord = numberLocalStorageState("games_won_as_landlord");
var ranksUp = numberLocalStorageState("ranks_up");
var gameStatistics = combineState({
    gamesPlayed: gamesPlayed,
    gamesPlayedAsDefending: gamesPlayedAsDefending,
    gamesPlayedAsLandlord: gamesPlayedAsLandlord,
    gamesWon: gamesWon,
    gamesWonAsDefending: gamesWonAsDefending,
    gamesWonAsLandlord: gamesWonAsLandlord,
    ranksUp: ranksUp,
});
/* harmony default export */ const GameStatistics = (gameStatistics);

;// ./src/state/Settings.ts


var fourColor = booleanLocalStorageState("four_color");
var darkMode = booleanLocalStorageState("dark_mode");
var svgCards = booleanLocalStorageState("svg_cards");
var showCardLabels = booleanLocalStorageState("show_card_labels");
var showLastTrick = booleanLocalStorageState("show_last_trick");
var beepOnTurn = booleanLocalStorageState("beep_on_turn");
var reverseCardOrder = booleanLocalStorageState("reverse_card_order");
var unsetAutoPlayWhenWinnerChanges = booleanLocalStorageState("unset_autoplay_on_winner_change");
var showTrickInPlayerOrder = booleanLocalStorageState("show_trick_in_player_order", true);
var separateCardsBySuit = booleanLocalStorageState("separate_cards_by_suit");
var disableSuitHighlights = booleanLocalStorageState("disable_suit_highlights");
var suitColorOverrides = JSONLocalStorageState("suit_color_overrides", {});
var playDrawCardSound = booleanLocalStorageState("play_draw_card_sound");
var showDebugInfo = booleanLocalStorageState("show_debug_info");
var showPlayerName = booleanLocalStorageState("show_player_name_in_title");
var hideChatBox = booleanLocalStorageState("hide_chat_box");
var showPointsAboveGame = booleanLocalStorageState("points_above_game");
var DEFAULT_POINT_CARD_ICON = "💰";
var pointCardIcon = stringLocalStorageState("point_card_icon", DEFAULT_POINT_CARD_ICON);
var DEFAULT_TRUMP_CARD_ICON = "👑";
var trumpCardIcon = stringLocalStorageState("trump_card_icon", DEFAULT_TRUMP_CARD_ICON);
// Default to the "fast" autodraw speed.
var DEFAULT_AUTODRAW_SPEED_MS = 10;
var autodrawSpeedMs = nullableNumberLocalStorageState("autodrawSpeedMs", DEFAULT_AUTODRAW_SPEED_MS);
var settings = combineState({
    fourColor: fourColor,
    darkMode: darkMode,
    showCardLabels: showCardLabels,
    showLastTrick: showLastTrick,
    beepOnTurn: beepOnTurn,
    reverseCardOrder: reverseCardOrder,
    unsetAutoPlayWhenWinnerChanges: unsetAutoPlayWhenWinnerChanges,
    showTrickInPlayerOrder: showTrickInPlayerOrder,
    svgCards: svgCards,
    separateCardsBySuit: separateCardsBySuit,
    disableSuitHighlights: disableSuitHighlights,
    suitColorOverrides: suitColorOverrides,
    playDrawCardSound: playDrawCardSound,
    showDebugInfo: showDebugInfo,
    showPlayerName: showPlayerName,
    hideChatBox: hideChatBox,
    showPointsAboveGame: showPointsAboveGame,
    pointCardIcon: pointCardIcon,
    trumpCardIcon: trumpCardIcon,
    autodrawSpeedMs: autodrawSpeedMs,
});
/* harmony default export */ const Settings = (settings);

;// ./src/AppStateProvider.tsx
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};





/// The part of the hash that names a room ("" for `#user/<name>` and for an
/// empty hash). Room codes are exactly 16 characters.
var roomNameFromHash = function (hash) {
    var trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
    return trimmed.startsWith("user/") ? "" : trimmed.slice(0, 16);
};
var appState = combineState({
    settings: Settings,
    gameStatistics: GameStatistics,
    connected: noPersistence(function () { return false; }),
    everConnected: noPersistence(function () { return false; }),
    roomName: noPersistence(function () { return roomNameFromHash(window.location.hash); }),
    name: stringLocalStorageState("name"),
    auth: noPersistence(function () { return null; }),
    authLoading: noPersistence(function () { return true; }),
    seats: noPersistence(function () { return null; }),
    roomRatings: noPersistence(function () { return null; }),
    lastMatchFinished: noPersistence(function () { return null; }),
    lastMatchRated: noPersistence(function () { return null; }),
    changeLogLastViewed: numberLocalStorageState("change_log_last_viewed"),
    gameState: noPersistence(function () { return null; }),
    headerMessages: noPersistence(function () { return []; }),
    errors: noPersistence(function () { return []; }),
    messages: noPersistence(function () { return []; }),
    confetti: noPersistence(function () { return null; }),
});
var AppStateContext = react.createContext({
    state: appState.loadDefault(),
    updateState: function () { },
});
var SettingsContext = react.createContext(appState.loadDefault().settings);
var AppStateConsumer = AppStateContext.Consumer;
var AppStateProvider = function (props) {
    var _a = react.useState(function () {
        return appState.loadDefault();
    }), state = _a[0], setState = _a[1];
    var updateState = function (newState) {
        setState(function (s) {
            var combined = __assign(__assign({}, s), newState);
            appState.persist(state, combined);
            return combined;
        });
    };
    return (react.createElement(AppStateContext.Provider, { value: { state: state, updateState: updateState } },
        react.createElement(SettingsContext.Provider, { value: state.settings }, props.children)));
};
/* harmony default export */ const src_AppStateProvider = (AppStateProvider);

;// ./src/memoize.ts
var memoize = function (f) {
    var state = { called: false };
    return function () {
        if (state.called) {
            return state.result;
        }
        else {
            state = { called: true, result: f() };
            return state.result;
        }
    };
};
/* harmony default export */ const src_memoize = (memoize);

;// ./src/beep.ts

var getContext = src_memoize(function () { return new window.AudioContext(); });
var beep = function (vol, freq, duration) {
    if (window.AudioContext !== undefined) {
        var beepContext = getContext();
        var v = beepContext.createOscillator();
        var u = beepContext.createGain();
        v.connect(u);
        v.frequency.value = freq;
        v.type = "square";
        u.connect(beepContext.destination);
        u.gain.value = vol * 0.01;
        v.start(beepContext.currentTime);
        v.stop(beepContext.currentTime + duration * 0.001);
    }
    else {
        alert("Your browser doesn't support the beep feature! Beep!");
    }
};
/* harmony default export */ const src_beep = (beep);

// EXTERNAL MODULE: ./src/api.ts
var api = __webpack_require__(4300);
;// ./src/websocketHandler.ts
var websocketHandler_assign = (undefined && undefined.__assign) || function () {
    websocketHandler_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return websocketHandler_assign.apply(this, arguments);
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};


var truncate = function (length) {
    return function (array) {
        if (array.length > length) {
            return array.slice(array.length - length);
        }
        else {
            return array;
        }
    };
};
var truncateMessages = truncate(300);
var messageHandler = function (state, message) {
    if ("Message" in message) {
        return { messages: truncateMessages(__spreadArray(__spreadArray([], state.messages, true), [message.Message], false)) };
    }
    else {
        return null;
    }
};
var broadcastHandler = function (state, message) {
    if ("Broadcast" in message) {
        var newMessage = {
            from: "GAME",
            message: message.Broadcast.message,
            data: message.Broadcast.data,
            from_game: true,
        };
        return { messages: truncateMessages(__spreadArray(__spreadArray([], state.messages, true), [newMessage], false)) };
    }
    else {
        return null;
    }
};
var errorHandler = function (state, message) {
    if ("Error" in message) {
        return { errors: __spreadArray(__spreadArray([], state.errors, true), [message.Error], false) };
    }
    else {
        return null;
    }
};
var stateHandler = function (_, message) {
    if ("State" in message) {
        return { gameState: message.State.state };
    }
    else {
        return null;
    }
};
var headerMessageHandler = function (_, message) {
    if ("Header" in message) {
        return { headerMessages: message.Header.messages };
    }
    else {
        return null;
    }
};
var lastBeeped = performance.now();
var beepHandler = function (message) {
    if ("Beep" in message) {
        var now = performance.now();
        // Rate-limit beeps to prevent annoyance.
        if (now - lastBeeped >= 1000) {
            src_beep(3, 261.63, 200);
            lastBeeped = now;
        }
    }
};
var lastReadyChecked = performance.now();
var readyCheckHandler = function (message, send) {
    if ("ReadyCheck" in message) {
        var now = performance.now();
        // Rate-limit beeps to prevent annoyance.
        if (now - lastReadyChecked >= 1000) {
            src_beep(3, 261.63, 200);
            lastReadyChecked = now;
            if (confirm("Are you ready to start the game?")) {
                send("Ready");
            }
        }
    }
};
var gameFinishedHandler = function (state, message) {
    if ("Broadcast" in message &&
        message.Broadcast.data.variant.type === "GameFinished") {
        var result = message.Broadcast.data.variant.result;
        var updates = {};
        if (state.name in result) {
            var ownResult = result[state.name];
            var gameStatistics = state.gameStatistics;
            var newGameStatistics = websocketHandler_assign({}, gameStatistics);
            newGameStatistics.gamesPlayed++;
            if (ownResult.is_defending) {
                newGameStatistics.gamesPlayedAsDefending++;
                if (ownResult.is_landlord) {
                    newGameStatistics.gamesPlayedAsLandlord++;
                }
            }
            if (ownResult.won_game) {
                newGameStatistics.gamesWon++;
                if (ownResult.is_defending) {
                    newGameStatistics.gamesWonAsDefending++;
                    if (ownResult.is_landlord) {
                        newGameStatistics.gamesWonAsLandlord++;
                    }
                }
            }
            newGameStatistics.ranksUp += ownResult.ranks_up;
            updates.gameStatistics = newGameStatistics;
        }
        var gameWinners = Object.entries(result)
            .filter(function (r) { return r[1].confetti; })
            .map(function (r) { return r[0]; });
        if (gameWinners.length > 0) {
            var group = gameWinners
                .join(", ")
                .replace(/, ((?:.(?!, ))+)$/, " and $1");
            updates.confetti = "".concat(group, " successfully defended on the final level!");
        }
        if (updates.gameStatistics !== undefined ||
            updates.confetti !== undefined) {
            return updates;
        }
    }
    return null;
};
var joinedHandler = function (_, message) {
    if ("Joined" in message) {
        var j = message.Joined;
        return {
            name: j.username,
            seats: {
                username: j.username,
                names: j.names,
                playerIds: j.player_ids,
                playerMode: j.player_mode,
            },
        };
    }
    else {
        return null;
    }
};
var roomRatingsHandler = function (_, message) {
    if ("RoomRatings" in message) {
        return {
            roomRatings: {
                mode: message.RoomRatings.mode,
                ratings: message.RoomRatings.ratings,
            },
        };
    }
    else {
        return null;
    }
};
var formatMatchRated = function (mode, changes) {
    return "Match rated (".concat(mode === "1v1" ? "1v1" : "team", " ladder): ") +
        changes
            .map(function (c) { return "".concat(c.username, " ").concat(c.before, " \u2192 ").concat(c.after, " (").concat((0,api/* formatDelta */.CW)(c.delta), ")"); })
            .join(", ");
};
/// `MatchRated` arrives once, after a rated match has ended: it becomes a
/// chat message and feeds the match summary modal.
var matchRatedHandler = function (state, message) {
    if ("MatchRated" in message) {
        var u = message.MatchRated;
        var newMessage = {
            from: "GAME",
            message: formatMatchRated(u.mode, u.changes),
            from_game: true,
            ratings: { match_id: u.match_id, mode: u.mode, changes: u.changes },
        };
        return {
            messages: truncateMessages(__spreadArray(__spreadArray([], state.messages, true), [newMessage], false)),
            lastMatchRated: {
                matchId: u.match_id,
                mode: u.mode,
                changes: u.changes,
            },
        };
    }
    else {
        return null;
    }
};
/// The `MatchFinished` broadcast opens the match summary modal (and any
/// `MatchRated` that follows fills in the rating changes).
var matchFinishedHandler = function (_, message) {
    if ("Broadcast" in message &&
        message.Broadcast.data.variant.type === "MatchFinished") {
        var variant = message.Broadcast.data.variant;
        return {
            lastMatchFinished: {
                matchKey: variant.match_key,
                firstToRank: variant.first_to_rank,
                standings: variant.standings,
            },
            lastMatchRated: null,
        };
    }
    else {
        return null;
    }
};
var systemHandler = function (state, message) {
    if ("System" in message) {
        var newMessage = {
            from: "GAME",
            message: message.System.message,
            from_game: true,
        };
        return { messages: truncateMessages(__spreadArray(__spreadArray([], state.messages, true), [newMessage], false)) };
    }
    else {
        return null;
    }
};
var allHandlers = [
    messageHandler,
    broadcastHandler,
    errorHandler,
    stateHandler,
    headerMessageHandler,
    gameFinishedHandler,
    joinedHandler,
    roomRatingsHandler,
    matchRatedHandler,
    matchFinishedHandler,
    systemHandler,
];
var composedHandlers = function (state, message, send) {
    var partials = {};
    allHandlers.forEach(function (h) {
        var partial = h(state, message);
        partials = websocketHandler_assign(websocketHandler_assign({}, partials), partial);
        state = websocketHandler_assign(websocketHandler_assign({}, state), partial);
    });
    beepHandler(message);
    readyCheckHandler(message, send);
    return partials;
};
/* harmony default export */ const websocketHandler = (composedHandlers);

// EXTERNAL MODULE: ./src/TimerProvider.tsx
var TimerProvider = __webpack_require__(3904);
// EXTERNAL MODULE: ./src/WasmContext.tsx
var WasmContext = __webpack_require__(3701);
;// ./src/WebsocketProvider.tsx
var WebsocketProvider_assign = (undefined && undefined.__assign) || function () {
    WebsocketProvider_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return WebsocketProvider_assign.apply(this, arguments);
};
var WebsocketProvider_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};







var WebsocketProvider_WebsocketContext = react.createContext({
    send: function () { },
});
var getFileReader = src_memoize(function () {
    var queue = [];
    var fr = new FileReader();
    fr.onload = function () {
        var next = queue.shift();
        if (next !== undefined) {
            next.handler(fr.result);
            if (queue.length > 0) {
                fr.readAsArrayBuffer(queue[0].blob);
            }
        }
    };
    return {
        enqueue: function (blob, handler) {
            queue.push({ blob: blob, handler: handler });
            if (queue.length > 0 &&
                (fr.readyState === FileReader.EMPTY ||
                    fr.readyState === FileReader.DONE)) {
                fr.readAsArrayBuffer(queue[0].blob);
            }
        },
    };
});
var getBlobArrayBuffer = src_memoize(function () {
    var queue = [];
    var inflight = [];
    var onload = function (arr) {
        var next = queue.shift();
        if (next !== undefined) {
            inflight.shift();
            next.handler(arr);
            if (queue.length > 0) {
                inflight.push(0);
                queue[0].blob.arrayBuffer().then(onload, function (err) { return console.log(err); });
            }
        }
    };
    return {
        enqueue: function (blob, handler) {
            queue.push({ blob: blob, handler: handler });
            if (inflight.length === 0 && queue.length > 0) {
                inflight.push(0);
                blob.arrayBuffer().then(onload, function (err) { return console.log(err); });
            }
        },
    };
});
/// Decode a binary frame from the server. Frames are normally zstd
/// compressed and go through the WASM decoder, but the no-WASM fallback
/// cannot decompress, and the backend sends some messages (pre-join errors)
/// as plain JSON bytes, so fall back to reading the bytes as UTF-8 JSON.
/// Returns null when neither works.
function decodeBinaryMessage(buf, decode) {
    try {
        return decode(new Uint8Array(buf));
    }
    catch (e) {
        console.warn("could not decode a binary message; trying plain JSON:", e);
    }
    try {
        return JSON.parse(new TextDecoder().decode(buf));
    }
    catch (e) {
        console.error("could not decode a message from the server:", e);
        return null;
    }
}
var WebsocketProvider = function (props) {
    var _a = react.useContext(AppStateContext), state = _a.state, updateState = _a.updateState;
    var decodeWireFormat = react.useContext(WasmContext/* default */.A).decodeWireFormat;
    var _b = react.useContext(TimerProvider/* TimerContext */.P), setTimeout = _b.setTimeout, clearTimeout = _b.clearTimeout;
    var _c = react.useState(null), timer = _c[0], setTimer = _c[1];
    // The socket is opened lazily, on the first `send` (i.e. when the user
    // joins a room), not on page load: the server hangs up on sockets that
    // don't authenticate within a few seconds, and people sit on the landing
    // page (signing in, reading the rules) for much longer than that.
    var wsRef = react.useRef(null);
    var pendingRef = react.useRef([]);
    // Because state/updateState are passed in and change every time something
    // happens, we need to maintain a reference to these props to prevent stale
    // closures which may happen if state/updateState is changed between when an
    // event listener is registered and when it fires.
    // https://reactjs.org/docs/hooks-faq.html#why-am-i-seeing-stale-props-or-state-inside-my-function
    var stateRef = react.useRef(state);
    var updateStateRef = react.useRef(updateState);
    var timerRef = react.useRef(timer);
    var setTimerRef = react.useRef(setTimer);
    var setTimeoutRef = react.useRef(setTimeout);
    var clearTimeoutRef = react.useRef(clearTimeout);
    var decodeRef = react.useRef(decodeWireFormat);
    react.useEffect(function () {
        stateRef.current = state;
        updateStateRef.current = updateState;
    }, [state, updateState]);
    react.useEffect(function () {
        setTimeoutRef.current = setTimeout;
        clearTimeoutRef.current = clearTimeout;
    }, [setTimeout, clearTimeout]);
    react.useEffect(function () {
        timerRef.current = timer;
        setTimerRef.current = setTimer;
    }, [timer, setTimerRef]);
    react.useEffect(function () {
        decodeRef.current = decodeWireFormat;
    }, [decodeWireFormat]);
    var handleMessage = function (ws, message) {
        if (message && typeof message === "object" && "Kicked" in message) {
            ws.close();
        }
        else {
            updateStateRef.current(WebsocketProvider_assign({ connected: true, everConnected: true }, websocketHandler(stateRef.current, message, function (msg) {
                ws.send(JSON.stringify(msg));
            })));
        }
    };
    /// Returns an open or connecting socket, creating one if needed.
    var connect = function () {
        var existing = wsRef.current;
        if (existing !== null &&
            (existing.readyState === WebSocket.OPEN ||
                existing.readyState === WebSocket.CONNECTING)) {
            return existing;
        }
        var ws = new WebSocket((0,api/* wsUrl */.yq)());
        wsRef.current = ws;
        ws.addEventListener("open", function () {
            updateStateRef.current({ connected: true, everConnected: true });
            var pending = pendingRef.current;
            pendingRef.current = [];
            pending.forEach(function (m) { return ws.send(m); });
        });
        ws.addEventListener("close", function () {
            if (wsRef.current === ws) {
                wsRef.current = null;
            }
            pendingRef.current = [];
            updateStateRef.current({ connected: false });
        });
        ws.addEventListener("error", function () {
            // Only surface connection failures on the landing page; in a room the
            // "disconnected, please refresh" screen takes over.
            if (stateRef.current.gameState === null) {
                updateStateRef.current({
                    errors: WebsocketProvider_spreadArray(WebsocketProvider_spreadArray([], stateRef.current.errors, true), [
                        "Could not connect to the game server; please try again.",
                    ], false),
                });
            }
        });
        ws.addEventListener("message", function (event) {
            if (timerRef.current !== null) {
                clearTimeoutRef.current(timerRef.current);
            }
            setTimerRef.current(null);
            // Check if the message is text (uncompressed JSON) or binary (compressed)
            if (typeof event.data === "string") {
                // Plain text JSON message (uncompressed)
                try {
                    handleMessage(ws, JSON.parse(event.data));
                }
                catch (e) {
                    console.error("Failed to parse JSON message:", e);
                }
            }
            else {
                // Binary message (compressed)
                var f = function (buf) {
                    var message = decodeBinaryMessage(buf, decodeRef.current);
                    if (message === null) {
                        updateStateRef.current({
                            errors: WebsocketProvider_spreadArray(WebsocketProvider_spreadArray([], stateRef.current.errors, true), [
                                "Could not decode a message from the server.",
                            ], false),
                        });
                        return;
                    }
                    handleMessage(ws, message);
                };
                if (event.data.arrayBuffer !== undefined) {
                    var b2a = getBlobArrayBuffer();
                    b2a.enqueue(event.data, f);
                }
                else {
                    var frs = getFileReader();
                    frs.enqueue(event.data, f);
                }
            }
        });
        return ws;
    };
    react.useEffect(function () {
        return function () {
            if (timerRef.current !== null) {
                clearTimeoutRef.current(timerRef.current);
            }
            if (wsRef.current !== null) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);
    var send = function (value) {
        if (timerRef.current !== null) {
            clearTimeoutRef.current(timerRef.current);
        }
        // We expect a response back from the server within 5 seconds. Otherwise,
        // we should assume we have lost our websocket connection.
        var localTimerRef = setTimeoutRef.current(function () {
            if (timerRef.current === localTimerRef) {
                updateStateRef.current({ connected: false });
            }
        }, 5000);
        setTimerRef.current(localTimerRef);
        var ws = connect();
        var payload = JSON.stringify(value);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
        else {
            pendingRef.current.push(payload);
        }
    };
    return (react.createElement(WebsocketProvider_WebsocketContext.Provider, { value: { send: send } }, props.children));
};
/* harmony default export */ const src_WebsocketProvider = (WebsocketProvider);

// EXTERNAL MODULE: ./src/Timeout.tsx
var Timeout = __webpack_require__(9625);
;// ./src/Errors.tsx



var Errors = function (props) {
    var updateState = react.useContext(AppStateContext).updateState;
    return (react.createElement("div", { className: "errors", onClick: function () { return updateState({ errors: [] }); } },
        react.createElement(Timeout/* default */.A, { timeout: 5000, callback: function () { return updateState({ errors: [] }); } }),
        props.errors.map(function (err, idx) { return (react.createElement("p", { key: idx },
            react.createElement("code", null, err))); })));
};
/* harmony default export */ const src_Errors = (Errors);

// EXTERNAL MODULE: ./node_modules/classnames/index.js
var classnames = __webpack_require__(6942);
var classnames_default = /*#__PURE__*/__webpack_require__.n(classnames);
// EXTERNAL MODULE: ./node_modules/styled-components/dist/styled-components.browser.esm.js + 9 modules
var styled_components_browser_esm = __webpack_require__(1510);
// EXTERNAL MODULE: ./src/preloadedCards.ts + 1 modules
var preloadedCards = __webpack_require__(7236);
;// ./src/util/array.ts
var array_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var sum = function (array) { return array.reduce(function (a, b) { return a + b; }, 0); };
var identity = function (l, r) { return l === r; };
// Subtracts one array from another. Works with arrays with duplicate values,
// and throws an exception if the smaller array is not completely contained in
// the larger one.
var minus = function (large, small, equality) {
    if (equality === void 0) { equality = identity; }
    var result = array_spreadArray([], large, true);
    small.forEach(function (valueToRemove) {
        var index = result.findIndex(function (t) { return equality(t, valueToRemove); });
        if (index >= 0) {
            result.splice(index, 1);
        }
    });
    return result;
};
var mapObject = function (array, mapper) {
    var result = {};
    array.forEach(function (t) {
        var _a = mapper(t), key = _a[0], value = _a[1];
        result[key] = value;
    });
    return result;
};
var range = function (count, fn) {
    return count !== undefined && count >= 0
        ? Array(count)
            .fill(undefined)
            .map(function (_, idx) { return fn(idx); })
        : [];
};
var shuffled = function (array) {
    return array
        .map(function (a) { return ({ sort: Math.random(), value: a }); })
        .sort(function (a, b) { return a.sort - b.sort; })
        .map(function (a) { return a.value; });
};
/* harmony default export */ const array = ({
    mapObject: mapObject,
    minus: minus,
    range: range,
    sum: sum,
    shuffled: shuffled,
});

;// ./src/util/cardHelpers.ts


var cardLookup = array.mapObject(preloadedCards/* default */.A, function (c) { return [c.value, c]; });
var suitToUnicode = {
    clubs: "♧",
    diamonds: "♢",
    hearts: "♡",
    spades: "♤",
};
var suitToFilledUnicode = {
    clubs: "♣",
    diamonds: "♦",
    hearts: "♥",
    spades: "♠",
};
var cardInfoToSuit = function (cardInfo) {
    switch (cardInfo.typ) {
        case "♢":
            return "diamonds";
        case "♧":
            return "clubs";
        case "♡":
            return "hearts";
        case "♤":
            return "spades";
        default:
            throw new Error("Invalid cardInfo");
    }
};
var unicodeToCard = function (unicode) {
    if (unicode === "🂠") {
        return { type: "unknown" };
    }
    if (!(unicode in cardLookup)) {
        throw new Error("Invalid card string: ".concat(unicode));
    }
    var cardInfo = cardLookup[unicode];
    if (unicode === "🃟") {
        return { type: "little_joker" };
    }
    else if (unicode === "🃏") {
        return { type: "big_joker" };
    }
    else {
        return {
            rank: cardInfo.number,
            suit: cardInfoToSuit(cardInfo),
            type: "suit_card",
        };
    }
};
var cardToUnicodeSuit = function (card, fill) {
    if (fill === void 0) { fill = true; }
    var table = fill ? suitToFilledUnicode : suitToUnicode;
    return table[card.suit];
};

;// ./src/InlineCard.tsx
var __makeTemplateObject = (undefined && undefined.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var InlineCard_assign = (undefined && undefined.__assign) || function () {
    InlineCard_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return InlineCard_assign.apply(this, arguments);
};




var InlineCardBase = styled_components_browser_esm/* default */.Ay.span(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  padding-left: 0.1em;\n  padding-right: 0.1em;\n"], ["\n  padding-left: 0.1em;\n  padding-right: 0.1em;\n"])));
function Suit(className) {
    var component = function (props) {
        var settings = react.useContext(SettingsContext);
        return (react.createElement(InlineCardBase, InlineCard_assign({ className: className }, props, { style: {
                color: settings.suitColorOverrides[className],
            } })));
    };
    component.displayName = "Suit";
    return component;
}
var Diamonds = Suit("♢");
var Hearts = Suit("♡");
var Spades = Suit("♤");
var Clubs = Suit("♧");
var LittleJoker = Suit("🃟");
var BigJoker = Suit("🃏");
var Unknown = Suit("🂠");
var suitComponent = function (suitCard) {
    switch (suitCard.suit) {
        case "diamonds":
            return Diamonds;
        case "hearts":
            return Hearts;
        case "clubs":
            return Clubs;
        case "spades":
            return Spades;
    }
};
var InlineCard = function (props) {
    var card = unicodeToCard(props.card);
    switch (card.type) {
        case "unknown":
            return react.createElement(Unknown, null, "\uD83C\uDCA0");
        case "big_joker":
            return react.createElement(BigJoker, null, "HJ");
        case "little_joker":
            return react.createElement(LittleJoker, null, "LJ");
        case "suit_card":
            // eslint-disable-next-line no-case-declarations
            var Component = suitComponent(card);
            return (react.createElement(Component, null,
                card.rank,
                cardToUnicodeSuit(card)));
    }
};
/* harmony default export */ const src_InlineCard = (InlineCard);
var templateObject_1;

// EXTERNAL MODULE: ./src/WasmOrRpcProvider.tsx
var WasmOrRpcProvider = __webpack_require__(671);
;// ./src/useEngine.tsx


function useEngine() {
    var context = react.useContext(WasmOrRpcProvider.EngineContext);
    if (!context) {
        throw new Error("useEngine must be used within a WasmOrRpcProvider");
    }
    return context;
}

// EXTERNAL MODULE: ./src/util/cachePrefill.ts
var cachePrefill = __webpack_require__(2895);
;// ./src/Card.tsx
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};








var SvgCard = react.lazy(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, __webpack_require__.e(/* import() */ 61).then(__webpack_require__.bind(__webpack_require__, 3469))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); });
var Card = function (props) {
    var settings = react.useContext(SettingsContext);
    var engine = useEngine();
    var _a = react.useState(null), cardInfo = _a[0], setCardInfo = _a[1];
    var _b = react.useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var height = props.smaller ? 95 : 120;
    var bounds = getCardBounds(height);
    // Create a cache key for the card info based on card and trump
    var cacheKey = "".concat(props.card, "_").concat((0,cachePrefill/* getTrumpKey */.us)(props.trump));
    react.useEffect(function () {
        // Only load card info if the card is in the lookup
        if (!(props.card in cardLookup)) {
            return;
        }
        // Check cache first
        if (cacheKey in cachePrefill/* cardInfoCache */.PU) {
            setCardInfo(cachePrefill/* cardInfoCache */.PU[cacheKey]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        // Check if a prefill is already in progress for this trump
        var existingPrefillPromise = (0,cachePrefill/* getPrefillPromise */.i7)(props.trump);
        if (existingPrefillPromise) {
            // Wait for existing prefill
            existingPrefillPromise
                .then(function () {
                // Check if our card is now cached
                if (cacheKey in cachePrefill/* cardInfoCache */.PU) {
                    setCardInfo(cachePrefill/* cardInfoCache */.PU[cacheKey]);
                    setIsLoading(false);
                }
                else {
                    // If still not cached after prefill, something went wrong
                    console.error("Card ".concat(props.card, " not in cache after prefill completed"));
                    var staticInfo = cardLookup[props.card];
                    setCardInfo({
                        suit: null,
                        effective_suit: "Unknown",
                        value: staticInfo.value || props.card,
                        display_value: staticInfo.display_value || props.card,
                        typ: staticInfo.typ || props.card,
                        number: staticInfo.number || null,
                        points: staticInfo.points || 0,
                    });
                    setIsLoading(false);
                }
            })
                .catch(function (error) {
                console.error("Failed to wait for prefill:", error);
                setIsLoading(false);
            });
            return;
        }
        // Check if we should trigger a full prefill for this trump
        var trumpKey = (0,cachePrefill/* getTrumpKey */.us)(props.trump);
        // Count how many cards are cached for this trump
        var cachedCount = Object.keys(cachePrefill/* cardInfoCache */.PU).filter(function (key) {
            return key.endsWith("_".concat(trumpKey));
        }).length;
        // If we have very few cached cards for this trump, prefill everything
        if (cachedCount < 5) {
            // Trigger full prefill for uncached trump
            // Start the prefill and wait for it
            (0,cachePrefill/* prefillCardInfoCache */.j9)(engine, props.trump)
                .then(function () {
                // Check if our card is now cached
                if (cacheKey in cachePrefill/* cardInfoCache */.PU) {
                    setCardInfo(cachePrefill/* cardInfoCache */.PU[cacheKey]);
                    setIsLoading(false);
                }
                else {
                    // Fallback if card still not in cache
                    var staticInfo = cardLookup[props.card];
                    setCardInfo({
                        suit: null,
                        effective_suit: "Unknown",
                        value: staticInfo.value || props.card,
                        display_value: staticInfo.display_value || props.card,
                        typ: staticInfo.typ || props.card,
                        number: staticInfo.number || null,
                        points: staticInfo.points || 0,
                    });
                    setIsLoading(false);
                }
            })
                .catch(function (error) {
                console.error("Failed to prefill cache:", error);
                // Fallback on error
                var staticInfo = cardLookup[props.card];
                setCardInfo({
                    suit: null,
                    effective_suit: "Unknown",
                    value: staticInfo.value || props.card,
                    display_value: staticInfo.display_value || props.card,
                    typ: staticInfo.typ || props.card,
                    number: staticInfo.number || null,
                    points: staticInfo.points || 0,
                });
                setIsLoading(false);
            });
            return;
        }
        // Only make individual request if no prefill is needed
        engine
            .batchGetCardInfo({
            requests: [
                {
                    card: props.card,
                    trump: props.trump,
                },
            ],
        })
            .then(function (response) {
            if (!response || !response.results || response.results.length === 0) {
                console.error("Invalid response from batchGetCardInfo:", response);
                // Fallback to basic info from static lookup
                var staticInfo = cardLookup[props.card];
                setCardInfo({
                    suit: null,
                    effective_suit: "Unknown",
                    value: staticInfo.value || props.card,
                    display_value: staticInfo.display_value || props.card,
                    typ: staticInfo.typ || props.card,
                    number: staticInfo.number || null,
                    points: staticInfo.points || 0,
                });
                setIsLoading(false);
                return;
            }
            var info = response.results[0];
            if (!info) {
                console.error("Card info is undefined in response:", response);
                // Fallback to basic info from static lookup
                var staticInfo = cardLookup[props.card];
                setCardInfo({
                    suit: null,
                    effective_suit: "Unknown",
                    value: staticInfo.value || props.card,
                    display_value: staticInfo.display_value || props.card,
                    typ: staticInfo.typ || props.card,
                    number: staticInfo.number || null,
                    points: staticInfo.points || 0,
                });
                setIsLoading(false);
                return;
            }
            // Cache the result with the trump-specific key
            cachePrefill/* cardInfoCache */.PU[cacheKey] = info;
            setCardInfo(info);
            setIsLoading(false);
        })
            .catch(function (error) {
            console.error("Error getting card info:", error);
            console.error("Error stack:", error.stack);
            // Fallback to basic info from static lookup
            var staticInfo = cardLookup[props.card];
            setCardInfo({
                suit: null,
                effective_suit: "Unknown",
                value: staticInfo.value || props.card,
                display_value: staticInfo.display_value || props.card,
                typ: staticInfo.typ || props.card,
                number: staticInfo.number || null,
                points: staticInfo.points || 0,
            });
            setIsLoading(false);
        });
    }, [cacheKey, props.card, props.trump, engine]);
    if (!(props.card in cardLookup)) {
        var nonSVG = (react.createElement("div", { className: classnames_default()("card", "unknown", props.className), style: {
                marginRight: props.collapseRight ? "-".concat(bounds.width * 0.6, "px") : "0",
            } },
            react.createElement(CardCanvas, { card: props.card, height: height, suit: classnames_default()("unknown", settings.fourColor ? "four-color" : null, settings.darkMode ? "dark-mode" : null), backgroundColor: settings.darkMode ? "#000" : "#fff" })));
        if (settings.svgCards) {
            return (react.createElement(react.Suspense, { fallback: nonSVG },
                react.createElement("div", { className: classnames_default()("card", "svg", "unknown", props.className), style: {
                        marginRight: props.collapseRight
                            ? "-".concat(bounds.width * 0.6, "px")
                            : "0",
                    } },
                    react.createElement(SvgCard, { fourColor: settings.fourColor, height: height, card: "🂠" }))));
        }
        else {
            return nonSVG;
        }
    }
    else {
        var staticCardInfo = cardLookup[props.card];
        var label = function (offset) {
            if (isLoading || !cardInfo)
                return null;
            return (react.createElement("div", { className: "card-label", style: { bottom: "".concat(offset, "px") } },
                react.createElement(src_InlineCard, { card: props.card })));
        };
        var icon = function (offset) {
            if (isLoading || !cardInfo)
                return null;
            return (react.createElement("div", { className: "card-icon", style: { bottom: "".concat(offset, "px") } },
                cardInfo.effective_suit === "Trump" && settings.trumpCardIcon,
                cardInfo.points > 0 && settings.pointCardIcon));
        };
        var nonSVG = (react.createElement("div", { className: classnames_default()("card", staticCardInfo.typ, props.className, isLoading ? "loading" : null), onClick: props.onClick, onMouseEnter: props.onMouseEnter, onMouseLeave: props.onMouseLeave, style: {
                marginRight: props.collapseRight ? "-".concat(bounds.width * 0.6, "px") : "0",
            } },
            label(bounds.height / 10),
            icon(bounds.height),
            react.createElement(CardCanvas, { card: staticCardInfo.display_value, height: height, suit: classnames_default()(staticCardInfo.typ, settings.fourColor ? "four-color" : null, settings.darkMode ? "dark-mode" : null), colorOverride: settings.suitColorOverrides[staticCardInfo.typ], backgroundColor: settings.darkMode ? "#000" : "#fff" })));
        if (settings.svgCards) {
            return (react.createElement(react.Suspense, { fallback: nonSVG },
                react.createElement("div", { className: classnames_default()("card", "svg", staticCardInfo.typ, props.className), onClick: props.onClick, onMouseEnter: props.onMouseEnter, onMouseLeave: props.onMouseLeave, style: {
                        marginRight: props.collapseRight
                            ? "-".concat(bounds.width * 0.6, "px")
                            : "0",
                    } },
                    label(height / 10),
                    icon(height),
                    react.createElement(SvgCard, { fourColor: settings.fourColor, height: height, card: props.card }))));
        }
        else {
            return nonSVG;
        }
    }
};
var computeCanvasBounds = function (font, dpr) {
    var c = document.createElement("canvas");
    c.style.display = "none";
    document.body.appendChild(c);
    var ctx = c.getContext("2d");
    if (ctx === null) {
        throw new Error("Could not get 2d context");
    }
    ctx.scale(dpr, dpr);
    ctx.font = font;
    var text = "🂠";
    var textMetrics = ctx.measureText(text);
    document.body.removeChild(c);
    return textMetrics;
};
var computeSuitColor = function (suit) {
    var c = document.createElement("div");
    c.className = suit;
    c.style.display = "none";
    document.body.appendChild(c);
    var color = getComputedStyle(c).color;
    document.body.removeChild(c);
    return color;
};
var cardBoundsCache = {};
var suitColorCache = {};
var getCardBounds = function (height) {
    var font = "".concat(height, "px solid");
    if (!(font in cardBoundsCache)) {
        cardBoundsCache[font] = src_memoize(function () { return computeCanvasBounds(font, 1); });
    }
    var textMetrics = cardBoundsCache[font]();
    var effectiveHeight = Math.round(textMetrics.actualBoundingBoxAscent +
        textMetrics.actualBoundingBoxDescent +
        2);
    var effectiveWidth = Math.round(textMetrics.actualBoundingBoxRight +
        Math.min(textMetrics.actualBoundingBoxLeft, 0) +
        2);
    return {
        metrics: textMetrics,
        height: effectiveHeight,
        width: effectiveWidth,
    };
};
var CardCanvas = function (props) {
    if (!(props.suit in suitColorCache)) {
        suitColorCache[props.suit] = src_memoize(function () { return computeSuitColor(props.suit); });
    }
    var _a = getCardBounds(props.height), metrics = _a.metrics, width = _a.width, height = _a.height;
    var style = suitColorCache[props.suit]();
    return (react.createElement("svg", { focusable: "false", role: "img", xmlns: "http://www.w3.org/2000/svg", height: height, width: width },
        react.createElement("rect", { fill: props.backgroundColor !== undefined ? props.backgroundColor : "#fff", x: metrics.actualBoundingBoxLeft, y: 0, width: metrics.width - 2, height: height }),
        react.createElement("text", { fill: props.colorOverride !== undefined ? props.colorOverride : style, fontSize: "".concat(props.height, "px"), textLength: "".concat(width, "px"), x: Math.min(metrics.actualBoundingBoxLeft, 0) + 1, y: height - metrics.actualBoundingBoxDescent - 1 }, props.card)));
};
/* harmony default export */ const src_Card = (Card);

;// ./src/LabeledPlay.tsx



var LabeledPlay = function (props) {
    var className = classnames_default()("label", {
        next: props.next !== undefined &&
            props.next !== null &&
            props.id === props.next,
    });
    var cards = (props.cards || []).map(function (card, idx) { return (react.createElement(src_Card, { card: card, key: idx, trump: props.trump, collapseRight: idx !== (props.cards || []).length - 1 })); });
    var groupedCards = props.groupedCards !== undefined
        ? props.groupedCards.map(function (c, gidx) { return (react.createElement("div", { className: "card-group", key: gidx }, c.map(function (card, idx) { return (react.createElement(src_Card, { trump: props.trump, card: card, key: "".concat(gidx, "-").concat(idx), collapseRight: idx !== c.length - 1 })); }))); })
        : cards;
    return (react.createElement("div", { className: classnames_default()("labeled-play", props.className, {
            clickable: props.onClick !== undefined,
        }), onClick: props.onClick !== undefined
            ? function (evt) {
                evt.preventDefault();
                if (props.onClick) {
                    props.onClick();
                }
            }
            : undefined },
        react.createElement("div", { className: "play" }, groupedCards),
        props.moreCards !== undefined && props.moreCards.length > 0 ? (react.createElement("div", { className: "play more" }, props.moreCards.map(function (card, idx) { return (react.createElement(src_Card, { trump: props.trump, card: card, key: idx, smaller: true, collapseRight: props.moreCards && idx !== props.moreCards.length - 1 })); }))) : null,
        react.createElement("div", { className: className }, props.label)));
};
/* harmony default export */ const src_LabeledPlay = (LabeledPlay);

;// ./src/PublicRoomsPane.tsx
var PublicRoomsPane_makeTemplateObject = (undefined && undefined.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var PublicRoomsPane_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var PublicRoomsPane_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




var Row = styled_components_browser_esm/* default */.Ay.div(PublicRoomsPane_templateObject_1 || (PublicRoomsPane_templateObject_1 = PublicRoomsPane_makeTemplateObject(["\n  display: table-row;\n  line-height: 23px;\n"], ["\n  display: table-row;\n  line-height: 23px;\n"])));
var LabelCell = styled_components_browser_esm/* default */.Ay.div(templateObject_2 || (templateObject_2 = PublicRoomsPane_makeTemplateObject(["\n  display: table-cell;\n  padding-right: 2em;\n  font-weight: bold;\n  width: 200px;\n"], ["\n  display: table-cell;\n  padding-right: 2em;\n  font-weight: bold;\n  width: 200px;\n"])));
var Cell = styled_components_browser_esm/* default */.Ay.div(templateObject_3 || (templateObject_3 = PublicRoomsPane_makeTemplateObject(["\n  display: table-cell;\n"], ["\n  display: table-cell;\n"])));
var PublicRoomRow = function (_a) {
    var roomName = _a.roomName, numPlayers = _a.numPlayers, setRoomName = _a.setRoomName;
    return (react.createElement(Row, null,
        react.createElement(Cell, null,
            react.createElement("button", { onClick: function (e) { return setRoomName(roomName, e); }, className: "normal" }, roomName)),
        react.createElement(Cell, null, numPlayers)));
};
var PublicRoomsPane = function (props) {
    var _a = (0,react.useState)([]), publicRooms = _a[0], setPublicRooms = _a[1];
    (0,react.useEffect)(function () {
        loadPublicRooms();
    }, []);
    var loadPublicRooms = function () {
        try {
            var fetchAsync = function () { return PublicRoomsPane_awaiter(void 0, void 0, void 0, function () {
                var fetchResult, resultJSON;
                return PublicRoomsPane_generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch((0,api/* apiUrl */.y0)("public_games.json"))];
                        case 1:
                            fetchResult = _a.sent();
                            return [4 /*yield*/, fetchResult.json()];
                        case 2:
                            resultJSON = _a.sent();
                            setPublicRooms(resultJSON);
                            return [2 /*return*/];
                    }
                });
            }); };
            fetchAsync().catch(function (e) {
                console.error(e);
            });
        }
        catch (err) {
            console.log(err);
        }
    };
    return (react.createElement("div", { className: "" },
        react.createElement("h3", null, "Public Rooms"),
        react.createElement("div", null,
            react.createElement("p", null, "The games listed below are open to the public. Join them to find new friends to play with!")),
        react.createElement("div", { style: { display: "table", borderSpacing: 10 } },
            react.createElement(Row, null,
                react.createElement(LabelCell, null, "Room Name"),
                react.createElement(LabelCell, null, "Players"),
                react.createElement(LabelCell, null,
                    react.createElement("button", { onClick: loadPublicRooms, className: "normal" }, "Refresh"))),
            publicRooms.length === 0 && react.createElement(Cell, null, "No public rooms available"),
            publicRooms.map(function (roomInfo) {
                return (react.createElement(PublicRoomRow, { key: roomInfo.name, roomName: roomInfo.name, numPlayers: roomInfo.num_players, setRoomName: props.setRoomName }));
            }))));
};
/* harmony default export */ const src_PublicRoomsPane = (PublicRoomsPane);
var PublicRoomsPane_templateObject_1, templateObject_2, templateObject_3;

// EXTERNAL MODULE: ./src/detectWasm.ts
var detectWasm = __webpack_require__(6649);
;// ./src/JoinRoom.tsx
var JoinRoom_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};








var JoinRoom = function (props) {
    var _a = react.useState(false), editable = _a[0], setEditable = _a[1];
    var _b = react.useState(props.room_name.length !== 16), shouldGenerate = _b[0], setShouldGenerate = _b[1];
    var _c = react.useState("Standard"), roomType = _c[0], setRoomType = _c[1];
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var _d = react.useContext(AppStateContext), state = _d.state, updateState = _d.updateState;
    var setTimeout = react.useContext(TimerProvider/* TimerContext */.P).setTimeout;
    var handleRoomChange = function (event) {
        return props.setRoomName(event.target.value.trim());
    };
    var handleSubmit = function (event) {
        event.preventDefault();
        if (props.name.length > 0 && props.room_name.length === 16) {
            var token = api/* getToken */.gf();
            if (token === null || token.length === 0) {
                // The stored token went away underneath us (signed out in another
                // tab, or a 401 cleared it): go back to the sign-in form instead of
                // sending a join with `token: null`.
                updateState({
                    auth: null,
                    errors: JoinRoom_spreadArray(JoinRoom_spreadArray([], state.errors, true), [
                        "You are signed out; please sign in again.",
                    ], false),
                });
                return;
            }
            send({
                room_name: props.room_name,
                token: token,
                disable_compression: !(0,detectWasm/* isWasmAvailable */.u)(),
                room_type: roomType,
                device_id: api/* deviceId */.wE(),
            });
        }
    };
    var editableRoomName = (react.createElement("input", { type: "text", placeholder: "Enter a room code", value: props.room_name, onChange: handleRoomChange, maxLength: 16 }));
    var nonEditableRoomName = (react.createElement("span", { title: "Set the room name", onClick: function (evt) {
            evt.preventDefault();
            setEditable(true);
        } }, props.room_name));
    var generateRoomName = function () {
        var arr = new Uint8Array(8);
        window.crypto.getRandomValues(arr);
        setShouldGenerate(false);
        props.setRoomName(Array.from(arr, function (d) { return ("0" + d.toString(16)).substr(-2); }).join(""));
    };
    if (shouldGenerate) {
        setTimeout(generateRoomName, 0);
    }
    return (react.createElement("div", null,
        react.createElement(src_LabeledPlay, { cards: ["🃟", "🃟", "🃏", "🃏"], trump: { NoTrump: {} }, label: null }),
        react.createElement("form", { className: "join-room", onSubmit: handleSubmit },
            react.createElement("div", null,
                react.createElement("h2", null,
                    react.createElement("label", null,
                        react.createElement("strong", null, "Room Name:"),
                        " ",
                        editable ? editableRoomName : nonEditableRoomName,
                        " ",
                        react.createElement("span", { title: "Generate new room", onClick: function () { return generateRoomName(); } }, "\uD83C\uDFB2"),
                        " "))),
            react.createElement("div", null,
                react.createElement("strong", null, "Playing as:"),
                " ",
                react.createElement("span", { className: "join-room-name", title: "Your account username" }, props.name),
                " ",
                react.createElement("span", { className: "auth-hint" }, "(your account name; sign out to change)")),
            react.createElement("fieldset", { className: "room-type" },
                react.createElement("legend", null,
                    react.createElement("strong", null, "Room type")),
                react.createElement("label", null,
                    react.createElement("input", { type: "radio", name: "room_type", value: "Standard", checked: roomType === "Standard", onChange: function () { return setRoomType("Standard"); } }),
                    " ",
                    "Standard (4+ players)"),
                react.createElement("label", null,
                    react.createElement("input", { type: "radio", name: "room_type", value: "OneVsOne", checked: roomType === "OneVsOne", onChange: function () { return setRoomType("OneVsOne"); } }),
                    " ",
                    "1v1 (two people, each plays both hands of a team)"),
                react.createElement("p", { className: "auth-hint" }, "The room type only matters when you are creating a new room; joining an existing room uses whatever type it already has.")),
            react.createElement("div", null,
                react.createElement("input", { type: "submit", value: "Join (or create) the game!", disabled: props.room_name.length !== 16 || props.name.length === 0 }))),
        react.createElement("div", null,
            react.createElement("p", null, "Welcome to the game! Pick a room code above (or roll the dice) to create a new room, or enter the code of an existing room to (re-)join it. If you were in the middle of a game, joining the same room with the same account picks up where you left off."),
            react.createElement("p", null,
                "Rooms are ",
                react.createElement("strong", null, "rated by default"),
                ", and they play",
                " ",
                react.createElement("strong", null, "matches"),
                ": a match is \u201Cfirst to rank N\u201D (5 by default) and is rated once, when it ends, for everyone at the table (team rooms on the team ladder, 1v1 rooms on the 1v1 ladder). Individual rounds never move ratings. You can change the target rank, or turn rating off entirely, in the game settings before the match starts."),
            react.createElement("p", null,
                react.createElement("strong", null, "1v1 rooms"),
                " are for exactly two people: each of you plays both seats of one team, so you see and control two hands. They are always Tractor (no Finding Friends)."),
            react.createElement("p", null,
                "If you're unfamiliar with the game, it might be helpful to",
                " ",
                react.createElement("a", { href: "rules.html", target: "_blank" }, "read the rules"),
                " ",
                "first. Your in-game name is always your account name, so you can no longer shadow another player by joining under their name; join as an observer instead and watch."),
            react.createElement("p", null, "Once you are in the game, share the room link with at least three friends (or one friend, for 1v1) to start playing!"),
            react.createElement("p", null, "This is a game with many house rules, so be sure to check out the game settings to see if your favorite rules are implemented. There's also a settings gear at the top, which can change how the game looks to you. Compared to upstream, the defaults here are fast autodraw and no taking back bids or plays.")),
        react.createElement(src_PublicRoomsPane, { setRoomName: props.setRoomName })));
};
/* harmony default export */ const src_JoinRoom = (JoinRoom);

;// ./src/Auth.tsx
var Auth_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Auth_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};



var GSI_SRC = "https://accounts.google.com/gsi/client";
var gsiPromise = null;
/// Inject the GSI script once and resolve with `google.accounts.id`.
function loadGoogleIdentity() {
    if (gsiPromise !== null) {
        return gsiPromise;
    }
    gsiPromise = new Promise(function (resolve, reject) {
        var _a, _b;
        var existing = (_b = (_a = window.google) === null || _a === void 0 ? void 0 : _a.accounts) === null || _b === void 0 ? void 0 : _b.id;
        if (existing !== undefined) {
            resolve(existing);
            return;
        }
        var script = document.createElement("script");
        script.src = GSI_SRC;
        script.async = true;
        script.defer = true;
        script.onload = function () {
            var _a, _b;
            var id = (_b = (_a = window.google) === null || _a === void 0 ? void 0 : _a.accounts) === null || _b === void 0 ? void 0 : _b.id;
            if (id !== undefined) {
                resolve(id);
            }
            else {
                reject(new Error("Google sign-in script loaded but is unusable"));
            }
        };
        script.onerror = function () {
            reject(new Error("could not load the Google sign-in script"));
        };
        document.head.appendChild(script);
    }).catch(function (e) {
        gsiPromise = null; // allow a retry on the next mount
        throw e;
    });
    return gsiPromise;
}
/// `GET /api/auth/config`, shared across the landing page.
function useAuthConfig() {
    var _a = react.useState(null), config = _a[0], setConfig = _a[1];
    var _b = react.useState(null), error = _b[0], setError = _b[1];
    react.useEffect(function () {
        var cancelled = false;
        api/* fetchAuthConfig */.rk().then(function (c) {
            if (!cancelled) {
                setConfig(c);
            }
        }, function (e) {
            if (!cancelled) {
                setError(api/* errorMessage */.gJ(e));
            }
        });
        return function () {
            cancelled = true;
        };
    }, []);
    return { config: config, error: error };
}
/// The official "Sign in with Google" button. Each mount (re)initializes
/// GSI with its own callback, which is fine because only one of these is on
/// screen at a time (sign-in form vs. account bar).
var GoogleButton = function (props) {
    var _a;
    var state = react.useContext(AppStateContext).state;
    var container = react.useRef(null);
    var callbackRef = react.useRef(props.onCredential);
    callbackRef.current = props.onCredential;
    var _b = react.useState(null), error = _b[0], setError = _b[1];
    var dark = state.settings.darkMode;
    var text = (_a = props.text) !== null && _a !== void 0 ? _a : "signin_with";
    react.useEffect(function () {
        var cancelled = false;
        loadGoogleIdentity().then(function (id) {
            if (cancelled || container.current === null) {
                return;
            }
            id.initialize({
                client_id: props.clientId,
                callback: function (r) { return callbackRef.current(r.credential); },
                ux_mode: "popup",
                auto_select: false,
                itp_support: true,
            });
            container.current.innerHTML = "";
            id.renderButton(container.current, {
                type: "standard",
                theme: dark ? "filled_black" : "outline",
                size: "large",
                text: text,
                shape: "rectangular",
                logo_alignment: "left",
            });
        }, function (e) {
            if (!cancelled) {
                setError(api/* errorMessage */.gJ(e));
            }
        });
        return function () {
            cancelled = true;
        };
    }, [props.clientId, text, dark]);
    return (react.createElement("div", { className: "google-button" },
        react.createElement("div", { ref: container }),
        error !== null && (react.createElement("p", { className: "auth-error" },
            "Google sign-in is unavailable: ",
            error))));
};
// ---------------------------------------------------------------------------
// Startup: turn a stored token back into a session.
// ---------------------------------------------------------------------------
/// Mounted once at app start. If a token is stored, asks the server who we
/// are; a 401 means the token is dead and gets cleared. Either way
/// `authLoading` ends up false.
///
/// It also follows the stored token across tabs (the `storage` event):
/// signing out in another tab signs this one out, and signing in (or as
/// someone else) in another tab restores that session here.
var AuthBootstrap = function () {
    var _a, _b;
    var _c = react.useContext(AppStateContext), state = _c.state, updateState = _c.updateState;
    // The token AppState currently holds, readable from the event listener
    // without a stale closure.
    var authTokenRef = react.useRef(null);
    authTokenRef.current = (_b = (_a = state.auth) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : null;
    react.useEffect(function () {
        // Only the most recent lookup may touch the state: a slow /me response
        // must not resurrect a session that was signed out while it was in
        // flight.
        var latest = 0;
        var restore = function () {
            var seq = ++latest;
            var token = api/* getToken */.gf();
            if (token === null || token.length === 0) {
                updateState({ auth: null, authLoading: false });
                return;
            }
            api.me().then(function (user) {
                if (seq !== latest) {
                    return;
                }
                updateState({
                    auth: { token: token, user: user },
                    name: user.username,
                    authLoading: false,
                });
            }, function (e) {
                if (seq !== latest) {
                    return;
                }
                if (e instanceof api/* ApiError */.hD && e.status === 401) {
                    api/* setToken */.WG(null);
                }
                else {
                    // Network / server trouble: keep the token so a refresh retries,
                    // but show the sign-in form rather than spinning forever.
                    console.error("could not restore session:", e);
                }
                updateState({ auth: null, authLoading: false });
            });
        };
        restore();
        var onStorage = function (event) {
            // `key === null` is another tab calling localStorage.clear().
            if (event.key !== null && event.key !== api/* TOKEN_KEY */.il) {
                return;
            }
            if (api/* getToken */.gf() !== authTokenRef.current) {
                restore();
            }
        };
        window.addEventListener("storage", onStorage);
        return function () {
            window.removeEventListener("storage", onStorage);
            latest++;
        };
    }, []);
    return null;
};
// ---------------------------------------------------------------------------
// The signed-out landing panel: Google sign-in (plus a dev login locally).
// ---------------------------------------------------------------------------
var USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
function usernameProblem(username) {
    if (!USERNAME_RE.test(username)) {
        return "Usernames are 3–20 characters: letters, digits and underscores only.";
    }
    return null;
}
/// Why there is no password field anywhere on this site.
var VibecodedNotice = function () { return (react.createElement("div", { className: "auth-warning", role: "note" },
    react.createElement("p", null,
        react.createElement("strong", null, "Heads up:"),
        " this site is ",
        react.createElement("strong", null, "vibecoded"),
        " and run by an ",
        react.createElement("strong", null, "idiot"),
        ". That is exactly why there are no passwords: Google handles signing in, and nothing secret is stored here. All this site keeps is your username, your ratings and your game history."))); };
var NoAltsRule = function () { return (react.createElement("div", { className: "auth-rule" },
    react.createElement("p", null,
        react.createElement("strong", null, "One account per person. Do not make alts."),
        " Matches are rated, and the site records which browser each account signs in from: a match between accounts that have shared a device is not rated, and it is obvious. Two accounts means both get removed."))); };
var Auth = function () {
    var _a;
    var updateState = react.useContext(AppStateContext).updateState;
    var _b = useAuthConfig(), config = _b.config, configError = _b.error;
    var _c = react.useState(""), devUsername = _c[0], setDevUsername = _c[1];
    var _d = react.useState(false), busy = _d[0], setBusy = _d[1];
    var _e = react.useState(null), error = _e[0], setError = _e[1];
    // Google sign-in for an account we have not seen before.
    var _f = react.useState(null), pending = _f[0], setPending = _f[1];
    var _g = react.useState(""), pickedUsername = _g[0], setPickedUsername = _g[1];
    var finish = function (session) {
        api/* setToken */.WG(session.token);
        updateState({
            auth: session,
            name: session.user.username,
            authLoading: false,
        });
    };
    var handleDevLogin = function (event) { return Auth_awaiter(void 0, void 0, void 0, function () {
        var name, problem, _a, e_1;
        return Auth_generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    event.preventDefault();
                    if (busy) {
                        return [2 /*return*/];
                    }
                    name = devUsername.trim();
                    problem = usernameProblem(name);
                    if (problem !== null) {
                        setError(problem);
                        return [2 /*return*/];
                    }
                    setBusy(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = finish;
                    return [4 /*yield*/, api/* devLogin */.pE(name)];
                case 2:
                    _a.apply(void 0, [_b.sent()]);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    setError(api/* errorMessage */.gJ(e_1));
                    return [3 /*break*/, 5];
                case 4:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleGoogle = function (credential) { return Auth_awaiter(void 0, void 0, void 0, function () {
        var response, e_2;
        return Auth_generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setBusy(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api/* googleSignIn */.Ab(credential)];
                case 2:
                    response = _a.sent();
                    if (api/* isNeedsUsername */.eH(response)) {
                        setPending(response);
                        setPickedUsername(response.suggested_username);
                    }
                    else {
                        finish(response);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    setError(api/* errorMessage */.gJ(e_2));
                    return [3 /*break*/, 5];
                case 4:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleComplete = function (event) { return Auth_awaiter(void 0, void 0, void 0, function () {
        var name, problem, _a, e_3;
        return Auth_generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    event.preventDefault();
                    if (busy || pending === null) {
                        return [2 /*return*/];
                    }
                    name = pickedUsername.trim();
                    problem = usernameProblem(name);
                    if (problem !== null) {
                        setError(problem);
                        return [2 /*return*/];
                    }
                    setBusy(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = finish;
                    return [4 /*yield*/, api/* googleComplete */.vJ(pending.pending, name)];
                case 2:
                    _a.apply(void 0, [_b.sent()]);
                    return [3 /*break*/, 5];
                case 3:
                    e_3 = _b.sent();
                    setError(api/* errorMessage */.gJ(e_3));
                    return [3 /*break*/, 5];
                case 4:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var googleClientId = (_a = config === null || config === void 0 ? void 0 : config.google_client_id) !== null && _a !== void 0 ? _a : null;
    var devLoginEnabled = (config === null || config === void 0 ? void 0 : config.dev_login) === true;
    if (pending !== null) {
        return (react.createElement("div", { className: "auth" },
            react.createElement("h2", null, "Almost there"),
            react.createElement("p", null, "Your Google account is verified. Pick the username other players will see (3\u201320 characters: letters, digits, underscores). You cannot change it later."),
            react.createElement("form", { className: "auth-form", onSubmit: handleComplete },
                react.createElement("label", null,
                    react.createElement("strong", null, "Username:"),
                    " ",
                    react.createElement("input", { type: "text", value: pickedUsername, onChange: function (e) { return setPickedUsername(e.target.value); }, autoComplete: "username", maxLength: 20, autoFocus: true })),
                react.createElement(NoAltsRule, null),
                error !== null && react.createElement("p", { className: "auth-error" }, error),
                react.createElement("div", null,
                    react.createElement("input", { type: "submit", value: "Create account", disabled: busy }),
                    " ",
                    react.createElement("button", { type: "button", className: "normal", onClick: function () {
                            setPending(null);
                            setError(null);
                        }, disabled: busy }, "Cancel")))));
    }
    return (react.createElement("div", { className: "auth" },
        react.createElement("p", null, "You need an account to play: in-game names are account names, and matches are rated. Sign in with Google below."),
        react.createElement(VibecodedNotice, null),
        googleClientId !== null && (react.createElement("div", { className: "auth-google" },
            react.createElement(GoogleButton, { clientId: googleClientId, onCredential: function (credential) {
                    handleGoogle(credential).catch(function (e) { return console.error(e); });
                }, text: "continue_with" }),
            react.createElement("p", { className: "auth-hint" }, "The first time you sign in you pick the username other players will see. There is nothing else to set up, and no password to forget."))),
        devLoginEnabled && (react.createElement("div", { className: "auth-dev" },
            googleClientId !== null && react.createElement("p", { className: "auth-or" }, "or"),
            react.createElement("h4", null, "Dev sign-in (local testing only)"),
            react.createElement("p", { className: "auth-hint" },
                "This server has ",
                react.createElement("code", null, "DEV_LOGIN"),
                " turned on: any username signs in (and is created) without any verification. It is never on in production."),
            react.createElement("form", { className: "auth-form", onSubmit: handleDevLogin },
                react.createElement("label", null,
                    react.createElement("strong", null, "Username:"),
                    " ",
                    react.createElement("input", { type: "text", value: devUsername, onChange: function (e) { return setDevUsername(e.target.value); }, autoComplete: "username", maxLength: 20 })),
                react.createElement("div", null,
                    react.createElement("input", { type: "submit", value: "Dev sign-in", disabled: busy }))))),
        googleClientId === null && !devLoginEnabled && config !== null && (react.createElement("p", { className: "auth-error" },
            "Sign-in is not configured on this server: it has no Google client ID and no dev login, so there is no way to make or use an account. If this is your server, set ",
            react.createElement("code", null, "GOOGLE_CLIENT_ID"),
            ".")),
        react.createElement(NoAltsRule, null),
        error !== null && react.createElement("p", { className: "auth-error" }, error),
        configError !== null && (react.createElement("p", { className: "auth-hint" },
            "(Could not check how sign-in is configured on this server:",
            " ",
            configError,
            ")"))));
};
/* harmony default export */ const src_Auth = (Auth);

;// ./src/AccountBar.tsx
var AccountBar_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var AccountBar_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};



/// Signed-in header on the landing page: who you are, your two ratings, a
/// link to your account page, and sign out (here and everywhere).
var AccountBar = function () {
    var _a = react.useContext(AppStateContext), state = _a.state, updateState = _a.updateState;
    var auth = state.auth;
    var _b = react.useState(false), busy = _b[0], setBusy = _b[1];
    if (auth === null) {
        return null;
    }
    var user = auth.user;
    var signOutLocally = function () {
        api/* setToken */.WG(null);
        updateState({ auth: null });
    };
    var signOut = function (everywhere) { return AccountBar_awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return AccountBar_generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    if (!everywhere) return [3 /*break*/, 3];
                    return [4 /*yield*/, api/* logoutAll */.Ie()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, api/* logout */.ri()];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1 = _a.sent();
                    // The token is being thrown away regardless.
                    console.warn("logout request failed:", e_1);
                    return [3 /*break*/, 8];
                case 7:
                    setBusy(false);
                    signOutLocally();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var ratingTitle = "Your rating on this ladder, with the number of rated matches and your win–loss (–draw) record. Ratings only move when a match ends.";
    return (react.createElement("div", { className: "account-bar" },
        react.createElement("div", { className: "account-summary" },
            react.createElement("span", null,
                "Signed in as ",
                react.createElement("strong", null, user.username)),
            react.createElement("span", { className: "account-ratings", title: ratingTitle },
                react.createElement("span", null,
                    "team",
                    " ",
                    react.createElement("strong", null, api/* formatRatingWithRecord */.k6(user.ratings.team))),
                react.createElement("span", null,
                    "1v1",
                    " ",
                    react.createElement("strong", null, api/* formatRatingWithRecord */.k6(user.ratings["1v1"])))),
            react.createElement("span", { className: "account-actions" },
                react.createElement("a", { href: "#user/".concat(encodeURIComponent(user.username)) }, "Your account page"),
                " ",
                react.createElement("button", { type: "button", className: "normal", onClick: function () {
                        signOut(false).catch(function (e) { return console.error(e); });
                    }, disabled: busy }, "Sign out"),
                " ",
                react.createElement("button", { type: "button", className: "normal", onClick: function () {
                        signOut(true).catch(function (e) { return console.error(e); });
                    }, disabled: busy, title: "Revokes every session of this account, including this one" }, "Sign out everywhere")))));
};
/* harmony default export */ const src_AccountBar = (AccountBar);

;// ./src/AccountPage.tsx


/// The link to another account page. The base URL is the page itself, so a
/// bare hash is enough.
var accountHref = function (username) {
    return "#user/".concat(encodeURIComponent(username));
};
var ladderName = function (mode) {
    return mode === "1v1" ? "1v1 ladder" : "team ladder";
};
/// "won" / "lost" / "drew", as a verb with the player as the subject.
var resultVerb = function (result) {
    switch (result) {
        case "won":
            return "won";
        case "lost":
            return "lost";
        default:
            return "drew";
    }
};
/// `47 (68%)`, or just `0` when there is nothing to take a percentage of.
var withPercent = function (count, total) {
    return total > 0 ? "".concat(count, " (").concat(Math.round((count / total) * 100), "%)") : "".concat(count);
};
var Ladders = function (props) { return (react.createElement("table", { className: "leaderboard-table account-ladders" },
    react.createElement("thead", null,
        react.createElement("tr", null,
            react.createElement("th", null, "Ladder"),
            react.createElement("th", null, "Rating"),
            react.createElement("th", null, "Matches"),
            react.createElement("th", null, "W\u2013L\u2013D"))),
    react.createElement("tbody", null, ["team", "1v1"].map(function (mode) {
        var _a;
        var rating = props.ratings[mode];
        return (react.createElement("tr", { key: mode },
            react.createElement("td", null, ladderName(mode)),
            react.createElement("td", null, api/* formatRating */.Xq(rating)),
            react.createElement("td", null, (_a = rating === null || rating === void 0 ? void 0 : rating.matches) !== null && _a !== void 0 ? _a : 0),
            react.createElement("td", null, api/* formatWinLossDraw */.po(rating))));
    })))); };
var Stats = function (props) {
    var s = props.stats;
    var rows = [
        ["Rounds played", "".concat(s.rounds)],
        ["Rounds won", withPercent(s.rounds_won, s.rounds)],
        [
            "Rounds on the defending team",
            "".concat(s.defender_rounds, " (won ").concat(withPercent(s.defender_wins, s.defender_rounds), ")"),
        ],
        [
            "Rounds as the landlord",
            "".concat(s.landlord_rounds, " (won ").concat(withPercent(s.landlord_wins, s.landlord_rounds), ")"),
        ],
        ["Levels gained", "".concat(s.levels_gained)],
        ["Matches played", "".concat(s.matches)],
        [
            "Matches won / lost / drawn",
            "".concat(s.matches_won, " / ").concat(s.matches_lost, " / ").concat(s.matches_drawn),
        ],
        ["Rated matches", "".concat(s.rated_matches)],
    ];
    return (react.createElement("table", { className: "leaderboard-table account-stats" },
        react.createElement("tbody", null, rows.map(function (_a) {
            var label = _a[0], value = _a[1];
            return (react.createElement("tr", { key: label },
                react.createElement("td", null, label),
                react.createElement("td", null, value)));
        }))));
};
var Match = function (props) {
    var match = props.match, username = props.username;
    var ratedLabel = !match.rated
        ? "unrated"
        : match.rating_applied === false
            ? "rated (ratings were not applied)"
            : "rated";
    return (react.createElement("li", { className: "account-match" },
        react.createElement("div", { className: "account-match-header" },
            react.createElement("strong", null, api/* formatDate */.Yq(match.finished_at)),
            " · ",
            ladderName(match.mode),
            " · ",
            ratedLabel,
            " · ",
            "first to rank ",
            match.first_to_rank,
            " · ",
            match.rounds === 1 ? "1 round" : "".concat(match.rounds, " rounds")),
        react.createElement("ul", { className: "account-match-players" }, match.players.map(function (p) { return (react.createElement("li", { key: p.username, className: p.username === username ? "me" : undefined },
            react.createElement("a", { href: accountHref(p.username) }, p.username),
            " \u2014 rank",
            " ",
            p.final_rank,
            " (",
            p.levels,
            " ",
            p.levels === 1 ? "level" : "levels",
            "),",
            " ",
            resultVerb(p.result),
            p.result === "won" ? " 🏆" : "")); })),
        react.createElement("div", { className: "account-match-outcome" },
            react.createElement("strong", null, username),
            " ",
            resultVerb(match.result),
            match.delta !== null &&
                match.delta !== undefined &&
                match.rating_before !== null &&
                match.rating_after !== null ? (react.createElement(react.Fragment, null,
                ": ",
                match.rating_before,
                " \u2192 ",
                match.rating_after,
                " (",
                api/* formatDelta */.CW(match.delta),
                ")")) : (react.createElement(react.Fragment, null, " (no rating change)")))));
};
/// The `#user/<username>` route: one account's ratings, statistics and
/// recent matches, from `GET /api/users/:username`.
var AccountPage = function (props) {
    var username = props.username;
    var _a = react.useState(null), profile = _a[0], setProfile = _a[1];
    var _b = react.useState(true), loading = _b[0], setLoading = _b[1];
    var _c = react.useState(false), notFound = _c[0], setNotFound = _c[1];
    var _d = react.useState(null), error = _d[0], setError = _d[1];
    react.useEffect(function () {
        var cancelled = false;
        setLoading(true);
        setNotFound(false);
        setError(null);
        setProfile(null);
        api/* fetchProfile */.eO(username).then(function (p) {
            if (!cancelled) {
                setProfile(p);
                setLoading(false);
            }
        }, function (e) {
            if (cancelled) {
                return;
            }
            if (e instanceof api/* ApiError */.hD && e.status === 404) {
                setNotFound(true);
            }
            else {
                setError(api/* errorMessage */.gJ(e));
            }
            setLoading(false);
        });
        return function () {
            cancelled = true;
        };
    }, [username]);
    var body;
    if (loading) {
        body = react.createElement("p", { className: "auth-hint" }, "Loading\u2026");
    }
    else if (notFound) {
        body = (react.createElement("p", { className: "auth-error" },
            "No such user: nobody plays here under the name",
            " ",
            react.createElement("strong", null, username),
            "."));
    }
    else if (profile === null) {
        body = (react.createElement("p", { className: "auth-error" },
            "Could not load this account: ", error !== null && error !== void 0 ? error : "unknown error"));
    }
    else {
        body = (react.createElement(react.Fragment, null,
            react.createElement("h2", null, profile.username),
            react.createElement("p", { className: "auth-hint" },
                "Member since ",
                api/* formatDate */.Yq(profile.created_at)),
            react.createElement("h3", null, "Ladders"),
            react.createElement(Ladders, { ratings: profile.ratings }),
            react.createElement("h3", null, "Statistics"),
            react.createElement("p", { className: "auth-hint" }, "Every finished round and match counts here, rated or not; the ladders above only count rated matches."),
            react.createElement(Stats, { stats: profile.stats }),
            react.createElement("h3", null, "Recent matches"),
            profile.recent_matches.length === 0 ? (react.createElement("p", { className: "auth-hint" }, "No finished matches yet.")) : (react.createElement("ul", { className: "account-matches" }, profile.recent_matches.map(function (m) { return (react.createElement(Match, { key: m.match_id, match: m, username: profile.username })); })))));
    }
    return (react.createElement("div", { className: "game account-page" },
        react.createElement("p", null,
            react.createElement("a", { href: "#" }, "\u2190 Back to the lobby")),
        body));
};
/* harmony default export */ const src_AccountPage = (AccountPage);

;// ./src/Leaderboard.tsx
var Leaderboard_assign = (undefined && undefined.__assign) || function () {
    Leaderboard_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return Leaderboard_assign.apply(this, arguments);
};




var initial = { loading: true, error: null, data: null };
var Ladder = function (props) {
    var _a;
    var state = props.state;
    var body;
    if (state.data === null && state.loading) {
        body = react.createElement("p", { className: "auth-hint" }, "Loading\u2026");
    }
    else if (state.data === null) {
        body = (react.createElement("p", { className: "auth-error" },
            "Could not load: ", (_a = state.error) !== null && _a !== void 0 ? _a : "unknown error"));
    }
    else if (state.data.entries.length === 0) {
        body = (react.createElement("p", { className: "auth-hint" }, "Nobody has finished a rated match on this ladder yet. Play one!"));
    }
    else {
        body = (react.createElement("table", { className: "leaderboard-table" },
            react.createElement("thead", null,
                react.createElement("tr", null,
                    react.createElement("th", null, "#"),
                    react.createElement("th", null, "Player"),
                    react.createElement("th", null, "Rating"),
                    react.createElement("th", null, "Matches"),
                    react.createElement("th", { title: "wins\u2013losses\u2013draws" }, "W\u2013L\u2013D"))),
            react.createElement("tbody", null, state.data.entries.map(function (entry, idx) { return (react.createElement("tr", { key: entry.username, className: entry.username === props.highlight ? "me" : "" },
                react.createElement("td", null, idx + 1),
                react.createElement("td", null,
                    react.createElement("a", { href: accountHref(entry.username) }, entry.username)),
                react.createElement("td", null, entry.rating),
                react.createElement("td", null, entry.matches),
                react.createElement("td", null, api/* formatWinLossDraw */.po(entry)))); }))));
    }
    return (react.createElement("div", { className: "ladder" },
        react.createElement("h4", null, props.title),
        react.createElement("p", { className: "auth-hint" }, props.blurb),
        body));
};
/// The two ladders (team / 1v1), side by side, with a refresh button.
var Leaderboard = function () {
    var _a, _b;
    var state = react.useContext(AppStateContext).state;
    var _c = react.useState(initial), team = _c[0], setTeam = _c[1];
    var _d = react.useState(initial), oneVsOne = _d[0], setOneVsOne = _d[1];
    var _e = react.useState(false), refreshing = _e[0], setRefreshing = _e[1];
    var load = react.useCallback(function () {
        setRefreshing(true);
        var fetchOne = function (mode, set) {
            set(function (s) { return (Leaderboard_assign(Leaderboard_assign({}, s), { loading: true })); });
            return api/* fetchLeaderboard */.kK(mode).then(function (data) { return set({ loading: false, error: null, data: data }); }, function (e) {
                return set(function (s) { return (Leaderboard_assign(Leaderboard_assign({}, s), { loading: false, error: api/* errorMessage */.gJ(e) })); });
            });
        };
        Promise.all([fetchOne("team", setTeam), fetchOne("1v1", setOneVsOne)])
            .catch(function (e) { return console.error(e); })
            .then(function () { return setRefreshing(false); });
    }, []);
    react.useEffect(function () {
        load();
    }, [load]);
    var me = (_b = (_a = state.auth) === null || _a === void 0 ? void 0 : _a.user.username) !== null && _b !== void 0 ? _b : null;
    return (react.createElement("div", { className: "leaderboard" },
        react.createElement("h3", null,
            "Leaderboard",
            " ",
            react.createElement("button", { type: "button", className: "normal", onClick: load, disabled: refreshing }, refreshing ? "Refreshing…" : "Refresh")),
        react.createElement("p", { className: "auth-hint" }, "Everyone who has finished at least one rated match on a ladder is listed on it, and ratings only move at the end of a match (see the project's RATINGS.md)."),
        react.createElement("div", { className: "leaderboard-tables" },
            react.createElement(Ladder, { mode: "team", title: "Team ladder", blurb: "Standard rooms with four or more players.", state: team, highlight: me }),
            react.createElement(Ladder, { mode: "1v1", title: "1v1 ladder", blurb: "1v1 rooms: two people, each playing both seats of a team.", state: oneVsOne, highlight: me }))));
};
/* harmony default export */ const src_Leaderboard = (Leaderboard);

;// ./src/Landing.tsx







/// The landing page: title, sign-in / registration, and (once signed in)
/// the account bar, the join-room form and the leaderboard.
var Landing = function () {
    var _a = react.useContext(AppStateContext), state = _a.state, updateState = _a.updateState;
    var title = (react.createElement("h1", null,
        "\u5347\u7EA7 / ",
        react.createElement("span", { className: "red" }, "Tractor"),
        " / \u627E\u670B\u53CB /",
        " ",
        react.createElement("span", { className: "red" }, "Finding Friends")));
    var intro = (react.createElement(react.Fragment, null,
        react.createElement("p", null, "Welcome! This website helps you play \u5347\u7EA7 / Tractor / \u627E\u670B\u53CB / Finding Friends with other people online, in rated matches."),
        react.createElement("p", null, "A match is \u201Cfirst to rank N\u201D (5 by default), and ratings move once, when the match ends."),
        react.createElement("p", null,
            "If you're not familiar with the rules, check them out",
            " ",
            react.createElement("a", { href: "rules.html" }, "here"),
            "!")));
    var content;
    if (state.authLoading) {
        content = react.createElement("p", null, "Loading your account...");
    }
    else if (state.auth === null) {
        content = react.createElement(src_Auth, null);
    }
    else {
        content = (react.createElement(react.Fragment, null,
            react.createElement(src_AccountBar, null),
            react.createElement(src_JoinRoom, { name: state.auth.user.username, room_name: state.roomName, setRoomName: function (roomName) {
                    updateState({ roomName: roomName });
                    window.location.hash = roomName;
                } }),
            react.createElement(src_Leaderboard, null)));
    }
    return (react.createElement(react.Fragment, null,
        react.createElement(src_Errors, { errors: state.errors }),
        react.createElement("div", { className: "game" },
            title,
            intro,
            content)));
};
/* harmony default export */ const src_Landing = (Landing);

// EXTERNAL MODULE: ./node_modules/react-tooltip/dist/react-tooltip.min.mjs
var react_tooltip_min = __webpack_require__(7008);
// EXTERNAL MODULE: ./node_modules/emoji-picker-react/dist/emoji-picker-react.esm.js + 1 modules
var emoji_picker_react_esm = __webpack_require__(4063);
;// ./src/ReadyCheck.tsx


var ReadyCheck = function () {
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    return (react.createElement("button", { className: "big", onClick: function () {
            return confirm("Are you ready to start the game?") && send("ReadyCheck");
        } }, "Check if everyone is ready!"));
};
/* harmony default export */ const src_ReadyCheck = (ReadyCheck);

;// ./src/LandlordSelector.tsx

var LandlordSelector = function (props) {
    var handleChange = function (e) {
        if (e.target.value === "") {
            props.onChange(null);
        }
        else {
            props.onChange(parseInt(e.target.value, 10));
        }
    };
    return (react.createElement("div", { className: "landlord-picker" },
        react.createElement("label", null,
            "Current leader:",
            " ",
            react.createElement("select", { value: props.landlordId === null ? "" : props.landlordId, onChange: handleChange, disabled: props.disabled },
                react.createElement("option", { value: "" }, "determined by the bid"),
                props.players.map(function (player) { return (react.createElement("option", { value: player.id, key: player.id }, player.name)); })))));
};
/* harmony default export */ const src_LandlordSelector = (LandlordSelector);

;// ./src/NumDecksSelector.tsx


var NumDecksSelector = function (props) {
    var handleChange = function (e) {
        var newNumDecks = e.target.value === "" ? null : parseInt(e.target.value, 10);
        props.onChange(newNumDecks);
    };
    return (react.createElement("div", { className: "num-decks-picker" },
        react.createElement("label", null,
            "Number of decks:",
            " ",
            react.createElement("select", { value: props.numDecks === null ? "" : props.numDecks, onChange: handleChange },
                react.createElement("option", { value: "" }, "default"),
                array.range(props.numPlayers, function (idx) {
                    var val = idx + 1;
                    return (react.createElement("option", { value: val, key: idx }, val));
                })))));
};
/* harmony default export */ const src_NumDecksSelector = (NumDecksSelector);

;// ./src/KittySizeSelector.tsx



var KittySizeSelector = function (props) {
    var engine = useEngine();
    var _a = react.useState(0), deckLen = _a[0], setDeckLen = _a[1];
    var _b = react.useState(true), isLoading = _b[0], setIsLoading = _b[1];
    react.useEffect(function () {
        setIsLoading(true);
        engine
            .computeDeckLen(props.decks)
            .then(function (len) {
            setDeckLen(len);
            setIsLoading(false);
        })
            .catch(function (error) {
            console.error("Error computing deck length:", error);
            // Fallback: estimate based on number of decks
            setDeckLen(props.decks.length * 54);
            setIsLoading(false);
        });
    }, [props.decks, engine]);
    var handleChange = function (e) {
        var newKittySize = e.target.value === "" ? null : parseInt(e.target.value, 10);
        props.onChange(newKittySize);
    };
    var kittyOffset = deckLen % props.numPlayers;
    var defaultOptions = [
        kittyOffset,
        kittyOffset + props.numPlayers,
        kittyOffset + 2 * props.numPlayers,
        kittyOffset + 3 * props.numPlayers,
        kittyOffset + 4 * props.numPlayers,
    ];
    var potentialOptions = array.range(kittyOffset + 4 * props.numPlayers, function (v) { return v; });
    var options = potentialOptions.filter(function (v) {
        return !defaultOptions.includes(v) &&
            v < deckLen - props.numPlayers &&
            // Note: this isn't quite right, but it seems fine for the common case of no short decks.
            (deckLen - v) % props.numPlayers <= props.decks.length * 4;
    });
    if (isLoading) {
        return react.createElement("div", null, "Loading kitty size options...");
    }
    return (react.createElement("div", null,
        react.createElement("label", null,
            "Number of cards in the bottom:",
            " ",
            react.createElement("select", { value: props.kittySize !== undefined && props.kittySize !== null
                    ? props.kittySize
                    : "", onChange: handleChange },
                react.createElement("optgroup", { label: "Standard" },
                    react.createElement("option", { value: "" }, "default"),
                    defaultOptions
                        .filter(function (v) { return v < deckLen - props.numPlayers; })
                        .map(function (v) { return (react.createElement("option", { value: v, key: v },
                        v,
                        " card",
                        v === 1 ? "" : "s")); })),
                react.createElement("optgroup", { label: "Requires removing cards from the deck" }, options.map(function (v) { return (react.createElement("option", { value: v, key: v },
                    v,
                    " card",
                    v === 1 ? "" : "s")); }))))));
};
/* harmony default export */ const src_KittySizeSelector = (KittySizeSelector);

;// ./src/RankSelector.tsx

// prettier-ignore
var allRanks = [
    '2', '3', '4', '5', '6', '7', '8',
    '9', '10', 'J', 'Q', 'K', 'A', 'NT'
];
var RankSelector = function (props) {
    var _a = react.useState(false), showMetaRank = _a[0], setShowMetaRank = _a[1];
    var handleChange = function (e) {
        if (e.target.value !== "") {
            props.onChangeRank(e.target.value);
        }
    };
    var handleMetaChange = function (e) {
        if (e.target.value !== "") {
            var v = parseInt(e.target.value, 10);
            props.onChangeMetaRank(v);
        }
    };
    var metaranks = [];
    if (props.metaRank > 0) {
        for (var i = 1; i <= props.metaRank + 3; i++) {
            metaranks.push(i);
        }
    }
    else {
        metaranks.push(props.metaRank);
        metaranks.push(1);
    }
    return (react.createElement("div", { className: "rank-picker" },
        react.createElement("label", null,
            "Your rank:",
            " ",
            react.createElement("select", { value: props.rank, onChange: handleChange, disabled: props.disabled }, allRanks.map(function (rank) { return (react.createElement("option", { value: rank, key: rank }, rank)); })),
            react.createElement("input", { type: "checkbox", checked: showMetaRank, onChange: function () { return setShowMetaRank(!showMetaRank); }, title: "show meta-rank", disabled: props.disabled }),
            showMetaRank && (react.createElement("select", { value: props.metaRank, onChange: handleMetaChange, disabled: props.disabled }, metaranks.map(function (metarank) { return (react.createElement("option", { value: metarank, key: metarank }, metarank)); }))))));
};
/* harmony default export */ const src_RankSelector = (RankSelector);

;// ./src/Kicker.tsx

var Kicker = function (props) {
    var _a = react.useState(null), selection = _a[0], setSelection = _a[1];
    var handleChange = function (e) {
        setSelection(e.target.value === "" ? null : parseInt(e.target.value, 10));
    };
    return (react.createElement("div", { className: "kicker" },
        react.createElement("label", null,
            "Kick player:",
            " ",
            react.createElement("select", { value: selection === null ? "" : selection, onChange: handleChange },
                react.createElement("option", { value: "" }),
                props.players.map(function (player) { return (react.createElement("option", { value: player.id, key: player.id }, player.name)); })),
            react.createElement("button", { className: "normal", onClick: function () {
                    if (selection) {
                        props.onKick(selection);
                    }
                }, disabled: selection === null }, "Kick"))));
};
/* harmony default export */ const src_Kicker = (Kicker);

;// ./src/RandomizePlayersButton.tsx



var RandomizePlayersButton = function (props) {
    var players = props.players;
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var randomize = function () {
        send({
            Action: { ReorderPlayers: array.shuffled(players.map(function (p) { return p.id; })) },
        });
    };
    return (react.createElement("button", { className: "big", onClick: randomize, disabled: props.disabled }, props.children));
};

;// ./src/RatedBanner.tsx



/// The room-level settings shared by every phase, or null when there is no
/// game state yet.
var propagatedOf = function (gameState) {
    if (gameState === null) {
        return null;
    }
    if ("Initialize" in gameState) {
        return gameState.Initialize.propagated;
    }
    if ("Draw" in gameState) {
        return gameState.Draw.propagated;
    }
    if ("Exchange" in gameState) {
        return gameState.Exchange.propagated;
    }
    if ("Play" in gameState) {
        return gameState.Play.propagated;
    }
    return null;
};
/// `rated` defaults to true on the server (serde default), so a missing
/// field means rated.
var isRated = function (propagated) {
    return propagated === null ||
        propagated.rated === undefined ||
        propagated.rated === null ||
        propagated.rated;
};
/// The rank a player has to reach to win the match. Defaults to 5 (serde
/// default on the server).
var firstToRankOf = function (propagated) {
    var rank = propagated === null || propagated === void 0 ? void 0 : propagated.first_to_rank;
    return rank === undefined || rank === null || rank === "" ? "5" : rank;
};
/// How many rounds of the current match have finished. A match is in
/// progress once this is greater than zero.
var roundsFinishedOf = function (propagated) {
    var finished = propagated === null || propagated === void 0 ? void 0 : propagated.num_games_finished;
    return finished === undefined || finished === null ? 0 : finished;
};
/// A one-line banner at the top of the game area: whether this match counts
/// towards ratings, how long it is, and which round of it is being played.
/// Visible in every phase; the settings themselves are changed from the
/// Initialize phase's game settings.
var RatedBanner = function () {
    var state = react.useContext(AppStateContext).state;
    var propagated = propagatedOf(state.gameState);
    if (propagated === null) {
        return null;
    }
    var oneVsOne = propagated.player_mode === "OneVsOne";
    var rated = isRated(propagated);
    var firstToRank = firstToRankOf(propagated);
    var roundsFinished = roundsFinishedOf(propagated);
    // Before the first round of a match starts the room sits in the lobby;
    // once cards are dealt it's round 1 even though nothing has finished yet.
    var inLobby = state.gameState !== null && "Initialize" in state.gameState;
    var parts = [
        rated ? "Rated match" : "Unrated match",
        "first to rank ".concat(firstToRank),
        roundsFinished > 0 || !inLobby
            ? "round ".concat(roundsFinished + 1)
            : "not started",
    ];
    if (oneVsOne) {
        parts.push("1v1 ladder");
    }
    return (react.createElement("div", { className: classnames_default()("rated-banner", {
            rated: rated,
            unrated: !rated,
        }), title: rated
            ? "The ".concat(oneVsOne ? "1v1" : "team", " ratings of everyone at the table move once, when this match ends.")
            : "This match does not affect ratings." }, parts.join(" · ")));
};
/* harmony default export */ const src_RatedBanner = (RatedBanner);

;// ./src/GameMode.tsx

var GameModeE = function (props) {
    var rules = (react.createElement("a", { href: "rules.html", target: "_blank" }, "rules"));
    if (props.gameMode === "Tractor") {
        return (react.createElement("span", null,
            "\u5347\u7EA7 / ",
            react.createElement("span", { className: "red" }, "Tractor"),
            " (",
            rules,
            ")"));
    }
    else {
        return (react.createElement("span", null,
            "\u627E\u670B\u53CB / ",
            react.createElement("span", { className: "red" }, "Finding Friends"),
            " (",
            rules,
            ")"));
    }
};
/* harmony default export */ const GameMode = (GameModeE);

;// ./src/IconButton.tsx
var IconButton_makeTemplateObject = (undefined && undefined.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var IconButton_assign = (undefined && undefined.__assign) || function () {
    IconButton_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return IconButton_assign.apply(this, arguments);
};


var Button = styled_components_browser_esm/* default */.Ay.button(IconButton_templateObject_1 || (IconButton_templateObject_1 = IconButton_makeTemplateObject(["\n  outline: none;\n  padding: 0;\n  margin: 0;\n  border: 0;\n  background-color: transparent;\n  transition:\n    opacity 100ms ease-in-out,\n    color 150ms ease-in-out,\n    transform 100ms ease-in-out;\n  color: #111;\n  &:hover {\n    color: #666;\n  }\n"], ["\n  outline: none;\n  padding: 0;\n  margin: 0;\n  border: 0;\n  background-color: transparent;\n  transition:\n    opacity 100ms ease-in-out,\n    color 150ms ease-in-out,\n    transform 100ms ease-in-out;\n  color: #111;\n  &:hover {\n    color: #666;\n  }\n"])));
var IconButton = function (props) {
    return react.createElement(Button, IconButton_assign({ className: "icon-button" }, props));
};
/* harmony default export */ const src_IconButton = (IconButton);
var IconButton_templateObject_1;

;// ./src/icons/BarChart.tsx

var BarChart = function (_a) {
    var _b = _a.width, width = _b === void 0 ? "100%" : _b;
    return (react.createElement("svg", { focusable: "false", role: "img", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16", fill: "currentColor", width: width },
        react.createElement("rect", { width: "4", height: "5", x: "1", y: "10", rx: "1" }),
        react.createElement("rect", { width: "4", height: "9", x: "6", y: "6", rx: "1" }),
        react.createElement("rect", { width: "4", height: "14", x: "11", y: "1", rx: "1" })));
};
/* harmony default export */ const icons_BarChart = (BarChart);

;// ./src/GameStatisticsPane.tsx
var GameStatisticsPane_makeTemplateObject = (undefined && undefined.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};


var GameStatisticsPane_Row = styled_components_browser_esm/* default */.Ay.div(GameStatisticsPane_templateObject_1 || (GameStatisticsPane_templateObject_1 = GameStatisticsPane_makeTemplateObject(["\n  display: table-row;\n  line-height: 23px;\n"], ["\n  display: table-row;\n  line-height: 23px;\n"])));
var GameStatisticsPane_LabelCell = styled_components_browser_esm/* default */.Ay.div(GameStatisticsPane_templateObject_2 || (GameStatisticsPane_templateObject_2 = GameStatisticsPane_makeTemplateObject(["\n  display: table-cell;\n  padding-right: 2em;\n  font-weight: bold;\n"], ["\n  display: table-cell;\n  padding-right: 2em;\n  font-weight: bold;\n"])));
var GameStatisticsPane_Cell = styled_components_browser_esm/* default */.Ay.div(GameStatisticsPane_templateObject_3 || (GameStatisticsPane_templateObject_3 = GameStatisticsPane_makeTemplateObject(["\n  display: table-cell;\n"], ["\n  display: table-cell;\n"])));
var percentage = function (numerator, denominator) {
    if (denominator > 0) {
        return ((numerator / denominator) * 100).toFixed(2) + "%";
    }
    return "n/a";
};
var ranksPerGame = function (ranks, numGames) {
    if (numGames > 0) {
        return (ranks / numGames).toFixed(3);
    }
    return "n/a";
};
var GameStatisticsRow = function (_a) {
    var label = _a.label, numPlayed = _a.numPlayed, numWon = _a.numWon;
    return (react.createElement(GameStatisticsPane_Row, null,
        react.createElement(GameStatisticsPane_LabelCell, null, label),
        react.createElement(GameStatisticsPane_Cell, null, numPlayed),
        react.createElement(GameStatisticsPane_Cell, null, numWon),
        react.createElement(GameStatisticsPane_Cell, null, percentage(numWon, numPlayed))));
};
var GameStatisticsPane = function (props) {
    var gameStatistics = props.gameStatistics;
    var gamesPlayedAsAttacking = gameStatistics.gamesPlayed - gameStatistics.gamesPlayedAsDefending;
    var gamesWonAsAttacking = gameStatistics.gamesWon - gameStatistics.gamesWonAsDefending;
    return (react.createElement("div", { className: "gameStatistics" },
        react.createElement("h3", null, "win statistics"),
        react.createElement("div", { style: { display: "table" } },
            react.createElement(GameStatisticsPane_Row, null,
                react.createElement(GameStatisticsPane_Cell, null),
                react.createElement(GameStatisticsPane_LabelCell, null, "played"),
                react.createElement(GameStatisticsPane_LabelCell, null, "won"),
                react.createElement(GameStatisticsPane_LabelCell, null, "percentage")),
            react.createElement(GameStatisticsRow, { label: "attacking", numPlayed: gamesPlayedAsAttacking, numWon: gamesWonAsAttacking }),
            react.createElement(GameStatisticsRow, { label: "defending", numPlayed: gameStatistics.gamesPlayedAsDefending, numWon: gameStatistics.gamesWonAsDefending }),
            react.createElement(GameStatisticsRow, { label: "as landlord", numPlayed: gameStatistics.gamesPlayedAsLandlord, numWon: gameStatistics.gamesWonAsLandlord }),
            react.createElement(GameStatisticsRow, { label: "total", numPlayed: gameStatistics.gamesPlayed, numWon: gameStatistics.gamesWon })),
        react.createElement("h3", null, "rank up statistics"),
        react.createElement("div", { style: { display: "table" } },
            react.createElement(GameStatisticsPane_Row, null,
                react.createElement(GameStatisticsPane_LabelCell, null, "ranks/game"),
                react.createElement(GameStatisticsPane_Cell, null, ranksPerGame(gameStatistics.ranksUp, gameStatistics.gamesPlayed))),
            react.createElement(GameStatisticsPane_Row, null,
                react.createElement(GameStatisticsPane_LabelCell, null, "ranks/win"),
                react.createElement(GameStatisticsPane_Cell, null, ranksPerGame(gameStatistics.ranksUp, gameStatistics.gamesWon))))));
};
/* harmony default export */ const src_GameStatisticsPane = (GameStatisticsPane);
var GameStatisticsPane_templateObject_1, GameStatisticsPane_templateObject_2, GameStatisticsPane_templateObject_3;

;// ./src/GameStatisticsButton.tsx






var contentStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
};
var GameStatisticsButton = function () {
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    var state = react.useContext(AppStateContext).state;
    return (react.createElement(react.Fragment, null,
        react.createElement(src_IconButton, { style: { paddingLeft: "10px" }, onClick: function () { return setModalOpen(true); } },
            react.createElement(icons_BarChart, { width: "2em" })),
        react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: contentStyle } },
            react.createElement(src_GameStatisticsPane, { gameStatistics: state.gameStatistics }))));
};
/* harmony default export */ const src_GameStatisticsButton = (GameStatisticsButton);

;// ./src/icons/Gear.tsx

var Gear = function (_a) {
    var _b = _a.width, width = _b === void 0 ? "100%" : _b;
    return (react.createElement("svg", { focusable: "false", role: "img", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512", width: width },
        react.createElement("path", { fill: "currentcolor", d: "M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" })));
};
/* harmony default export */ const icons_Gear = (Gear);

// EXTERNAL MODULE: ./node_modules/react-color/es/index.js + 218 modules
var es = __webpack_require__(5189);
;// ./src/SettingsPane.tsx
var SettingsPane_makeTemplateObject = (undefined && undefined.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var SettingsPane_assign = (undefined && undefined.__assign) || function () {
    SettingsPane_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return SettingsPane_assign.apply(this, arguments);
};
var SettingsPane_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var SettingsPane_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};





var Picker = react.lazy(function () { return SettingsPane_awaiter(void 0, void 0, void 0, function () { return SettingsPane_generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 4063))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); });
var SettingsPane_Row = styled_components_browser_esm/* default */.Ay.div(SettingsPane_templateObject_1 || (SettingsPane_templateObject_1 = SettingsPane_makeTemplateObject(["\n  display: table-row;\n  line-height: 23px;\n"], ["\n  display: table-row;\n  line-height: 23px;\n"])));
var SettingsPane_LabelCell = styled_components_browser_esm/* default */.Ay.div(SettingsPane_templateObject_2 || (SettingsPane_templateObject_2 = SettingsPane_makeTemplateObject(["\n  display: table-cell;\n  padding-right: 2em;\n"], ["\n  display: table-cell;\n  padding-right: 2em;\n"])));
var SettingsPane_Cell = styled_components_browser_esm/* default */.Ay.div(SettingsPane_templateObject_3 || (SettingsPane_templateObject_3 = SettingsPane_makeTemplateObject(["\n  display: table-cell;\n"], ["\n  display: table-cell;\n"])));
var SettingsPane = function (props) {
    var settings = props.settings;
    var makeChangeHandler = function (partialSettings) { return function () {
        var newSettings = SettingsPane_assign(SettingsPane_assign({}, props.settings), partialSettings);
        props.onChangeSettings(newSettings);
    }; };
    var _a = react.useState(""), link = _a[0], setLink = _a[1];
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var setChatLink = function (event) {
        event.preventDefault();
        if (link.length > 0) {
            send({ Action: { SetChatLink: link } });
        }
        else {
            send({ Action: { SetChatLink: null } });
        }
        setLink("");
    };
    var editor = (react.createElement("div", { style: { marginBottom: "15px" } },
        react.createElement("input", { type: "text", style: { width: "150px" }, value: link, onChange: function (evt) {
                evt.preventDefault();
                setLink(evt.target.value);
            }, placeholder: "https://... link to voice chat" }),
        react.createElement("input", { type: "button", onClick: setChatLink, value: "set" })));
    return (react.createElement("div", { className: "settings" },
        react.createElement("div", { style: { display: "table" } },
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "four-color mode"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "four-color-mode", type: "checkbox", checked: settings.fourColor, onChange: makeChangeHandler({ fourColor: !settings.fourColor }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "dark mode"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "dark-mode", type: "checkbox", checked: settings.darkMode, onChange: makeChangeHandler({ darkMode: !settings.darkMode }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "use SVG cards"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "svg-cards", type: "checkbox", checked: settings.svgCards, onChange: makeChangeHandler({ svgCards: !settings.svgCards }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "always show card labels"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "show-card-labels", type: "checkbox", checked: settings.showCardLabels, onChange: makeChangeHandler({
                            showCardLabels: !settings.showCardLabels,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "icon on point cards"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement(EmojiPicker, { value: settings.pointCardIcon, setEmoji: function (emoji) {
                            makeChangeHandler({
                                pointCardIcon: emoji,
                            })();
                        }, setDefault: makeChangeHandler({
                            pointCardIcon: DEFAULT_POINT_CARD_ICON,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "icon on trump cards"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement(EmojiPicker, { value: settings.trumpCardIcon, setEmoji: function (emoji) {
                            makeChangeHandler({
                                trumpCardIcon: emoji,
                            })();
                        }, setDefault: makeChangeHandler({
                            trumpCardIcon: DEFAULT_TRUMP_CARD_ICON,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "show last trick"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "show-last-trick", type: "checkbox", checked: settings.showLastTrick, onChange: makeChangeHandler({
                            showLastTrick: !settings.showLastTrick,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "beep on turn"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "beep-on-turn", type: "checkbox", checked: settings.beepOnTurn, onChange: makeChangeHandler({ beepOnTurn: !settings.beepOnTurn }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "reverse card order (in hand)"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "reverse-card-order", type: "checkbox", checked: settings.reverseCardOrder, onChange: makeChangeHandler({
                            reverseCardOrder: !settings.reverseCardOrder,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "separate cards by effective suit (in hand)"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "separate-cards-by-suit", type: "checkbox", checked: settings.separateCardsBySuit, onChange: makeChangeHandler({
                            separateCardsBySuit: !settings.separateCardsBySuit,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "disable suit highlights"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "disable-suit-highlights", type: "checkbox", checked: settings.disableSuitHighlights, onChange: makeChangeHandler({
                            disableSuitHighlights: !settings.disableSuitHighlights,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "unset auto-play if winner changes"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "unset-auto-play-when-winner-changes", type: "checkbox", checked: settings.unsetAutoPlayWhenWinnerChanges, onChange: makeChangeHandler({
                            unsetAutoPlayWhenWinnerChanges: !settings.unsetAutoPlayWhenWinnerChanges,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "show tricks in player order"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "show-trick-in-player-order", type: "checkbox", checked: settings.showTrickInPlayerOrder, onChange: makeChangeHandler({
                            showTrickInPlayerOrder: !settings.showTrickInPlayerOrder,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "suit color overrides"),
                react.createElement(SettingsPane_Cell, null, settings.svgCards ? ("disabled with SVG cards") : (react.createElement(SuitOverrides, { suitColors: settings.suitColorOverrides, setSuitColors: function (newOverrides) {
                        return props.onChangeSettings(SettingsPane_assign(SettingsPane_assign({}, props.settings), { suitColorOverrides: newOverrides }));
                    } })))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "play sound when drawing card"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "play-sound-when-drawing-card", type: "checkbox", checked: settings.playDrawCardSound, onChange: makeChangeHandler({
                            playDrawCardSound: !settings.playDrawCardSound,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "show debugging information"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "show-debug-info", type: "checkbox", checked: settings.showDebugInfo, onChange: makeChangeHandler({
                            showDebugInfo: !settings.showDebugInfo,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "show player name in title bar"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "show-player-name", type: "checkbox", checked: settings.showPlayerName, onChange: makeChangeHandler({
                            showPlayerName: !settings.showPlayerName,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "hide chat box"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "hide-chat-box", type: "checkbox", checked: settings.hideChatBox, onChange: makeChangeHandler({
                            hideChatBox: !settings.hideChatBox,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "show points bar above the game (rather than below)"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("input", { name: "show-points-above-game", type: "checkbox", checked: settings.showPointsAboveGame, onChange: makeChangeHandler({
                            showPointsAboveGame: !settings.showPointsAboveGame,
                        }) }))),
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "autodraw speed"),
                react.createElement(SettingsPane_Cell, null,
                    react.createElement("select", { value: settings.autodrawSpeedMs !== null
                            ? settings.autodrawSpeedMs
                            : "", onChange: function (e) {
                            return makeChangeHandler({
                                autodrawSpeedMs: parseInt(e.target.value),
                            })();
                        } },
                        react.createElement("option", { value: "10" }, "fast (default)"),
                        react.createElement("option", { value: "250" }, "medium"),
                        react.createElement("option", { value: "500" }, "slow"))))),
        react.createElement("hr", null),
        react.createElement("div", { style: { display: "table" } },
            react.createElement(SettingsPane_Row, null,
                react.createElement(SettingsPane_LabelCell, null, "chat link"),
                react.createElement(SettingsPane_Cell, null, editor)))));
};
var SuitOverrides = function (props) {
    var suits = ["♢", "♡", "♤", "♧", "🃟", "🃏"];
    var labels = ["♦", "♥", "♠", "♣", "LJ", "HJ"];
    return (react.createElement(react.Fragment, null,
        suits.map(function (suit, idx) { return (react.createElement(SuitColorPicker, { key: suit, suit: suit, label: labels[idx], suitColor: props.suitColors[suit], setSuitColor: function (color) {
                var n = SettingsPane_assign({}, props.suitColors);
                n[suit] = color;
                props.setSuitColors(n);
            } })); }),
        react.createElement("button", { className: "normal", onClick: function (evt) {
                evt.preventDefault();
                props.setSuitColors({});
            } }, "reset")));
};
var SuitColorPicker = function (props) {
    var _a = react.useState(false), showPicker = _a[0], setShowPicker = _a[1];
    return (react.createElement(react.Fragment, null,
        react.createElement("span", { className: props.suit, style: { color: props.suitColor, cursor: "pointer" }, onClick: function () { return setShowPicker(true); } }, props.label),
        showPicker ? (react.createElement("div", { style: { position: "absolute" } },
            react.createElement("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }, onClick: function () { return setShowPicker(false); } }),
            react.createElement(es/* CompactPicker */.WU, { color: props.suitColor, onChangeComplete: function (c) { return props.setSuitColor(c.hex); } }))) : null));
};
var EmojiPicker = function (props) {
    var _a = react.useState(false), showPicker = _a[0], setShowPicker = _a[1];
    return (react.createElement(react.Fragment, null,
        react.createElement("span", null, props.value),
        !showPicker && (react.createElement("button", { className: "normal", onClick: function () { return setShowPicker(true); } }, "pick")),
        showPicker && (react.createElement("button", { className: "normal", onClick: function () { return setShowPicker(false); } }, "hide")),
        react.createElement("button", { className: "normal", onClick: props.setDefault }, "reset"),
        props.value !== "" && (react.createElement("button", { className: "normal", onClick: function () { return props.setEmoji(""); } }, "no icon")),
        showPicker && (react.createElement(react.Suspense, { fallback: "..." },
            react.createElement(Picker, { onEmojiClick: function (emoji) {
                    props.setEmoji(emoji.emoji);
                } })))));
};
/* harmony default export */ const src_SettingsPane = (SettingsPane);
var SettingsPane_templateObject_1, SettingsPane_templateObject_2, SettingsPane_templateObject_3;

;// ./src/SettingsButton.tsx







var SettingsButton_contentStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "80%",
    transform: "translate(-50%, -50%)",
};
var SettingsButton = function () {
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    var _b = react.useContext(AppStateContext), state = _b.state, updateState = _b.updateState;
    return (react.createElement(react.Fragment, null,
        react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "settingsTip", place: "top" }),
        react.createElement(src_IconButton, { onClick: function () { return setModalOpen(true); }, "data-tooltip-id": "settingsTip", "data-tooltip-content": "Change user interface settings" },
            react.createElement(icons_Gear, { width: "2em" })),
        react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: SettingsButton_contentStyle } },
            react.createElement(src_SettingsPane, { settings: state.settings, onChangeSettings: function (settings) { return updateState({ settings: settings }); } }))));
};
/* harmony default export */ const src_SettingsButton = (SettingsButton);

;// ./src/Header.tsx




var Header = function (props) { return (react.createElement("div", null,
    react.createElement("h1", null,
        react.createElement(GameMode, { gameMode: props.gameMode }),
        "\u00A0",
        react.createElement(src_SettingsButton, null),
        react.createElement(src_GameStatisticsButton, null)),
    props.chatLink !== undefined && props.chatLink !== null ? (react.createElement("p", null,
        "Join the chat at",
        " ",
        react.createElement("a", { href: props.chatLink, target: "_blank", rel: "noreferrer" }, props.chatLink))) : null)); };
/* harmony default export */ const src_Header = (Header);

;// ./src/MovePlayerButton.tsx
var MovePlayerButton_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};


function MovePlayerButton(relative, children) {
    var component = function (props) {
        var players = props.players, player = props.player;
        var send = react.useContext(WebsocketProvider_WebsocketContext).send;
        var movePlayer = function () {
            var index = players.findIndex(function (p) { return p === player; });
            var newIndex = (index + relative) % players.length;
            var withoutPlayer = players.filter(function (p) { return p !== player; });
            var newPlayers = MovePlayerButton_spreadArray(MovePlayerButton_spreadArray(MovePlayerButton_spreadArray([], withoutPlayer.slice(0, newIndex), true), [
                player
            ], false), withoutPlayer.slice(newIndex, withoutPlayer.length), true);
            send({ Action: { ReorderPlayers: newPlayers.map(function (p) { return p.id; }) } });
        };
        return (react.createElement("button", { onClick: movePlayer, disabled: props.disabled }, children));
    };
    component.displayName = "MovePlayerButton";
    return component;
}
var MovePlayerLeft = MovePlayerButton(-1, "<");
var MovePlayerRight = MovePlayerButton(1, ">");

;// ./src/Players.tsx






/// " (1512)"; "" when the rating is not known (nobody has sent us the
/// room's ratings yet).
var ratingSuffix = function (rating) {
    if (rating === undefined || rating === null) {
        return "";
    }
    return " (".concat(rating.rating, ")");
};
/// The 1v1 second seat "alice (2)" is rated as the user "alice".
var seatUsername = function (seatName) {
    return seatName.replace(/ \(2\)$/, "");
};
var Players = function (props) {
    var _a, _b, _c;
    var players = props.players, observers = props.observers, landlord = props.landlord, landlords_team = props.landlords_team, movable = props.movable, movableDisabled = props.movableDisabled, next = props.next, name = props.name;
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var state = react.useContext(AppStateContext).state;
    var ratings = (_a = state.roomRatings) === null || _a === void 0 ? void 0 : _a.ratings;
    // Every seat this connection controls counts as "you" (two in 1v1 rooms).
    var ownNames = new Set((_c = (_b = state.seats) === null || _b === void 0 ? void 0 : _b.names) !== null && _c !== void 0 ? _c : []);
    ownNames.add(name);
    var ratingFor = function (p) {
        var _a;
        return ratings === undefined || ratings === null
            ? undefined
            : ((_a = ratings[p.name]) !== null && _a !== void 0 ? _a : ratings[seatUsername(p.name)]);
    };
    var makeDescriptor = function (p) {
        var rating = ratingSuffix(ratingFor(p));
        // The account page is a hash route on this very page, so a bare hash is
        // enough; open it in a new tab so nobody loses their seat.
        var nameLink = (react.createElement("a", { key: "name-".concat(p.id), href: accountHref(seatUsername(p.name)), target: "_blank", rel: "noreferrer", title: "".concat(seatUsername(p.name), "'s account page") }, p.name));
        if (p.metalevel <= 1) {
            return [nameLink, "".concat(rating, " (rank ").concat(p.level, ")")];
        }
        else {
            return [
                nameLink,
                "".concat(rating, " (rank ").concat(p.level),
                react.createElement("sup", { key: "meta-".concat(p.id) }, p.metalevel),
                ")",
            ];
        }
    };
    return (react.createElement("table", { className: "players" },
        react.createElement("tbody", null,
            react.createElement("tr", null,
                players.map(function (player) {
                    var className = classnames_default()("player", {
                        landlord: player.id === landlord || (landlords_team === null || landlords_team === void 0 ? void 0 : landlords_team.includes(player.id)),
                        movable: movable,
                        next: player.id === next,
                    });
                    var descriptor = makeDescriptor(player);
                    if (player.id === landlord) {
                        descriptor.push(" (当庄)");
                    }
                    if (ownNames.has(player.name)) {
                        descriptor.push(" (You!)");
                    }
                    return (react.createElement("td", { key: player.id, className: className },
                        descriptor,
                        movable && (react.createElement("span", { style: {
                                display: "block",
                                marginTop: "6px",
                                textAlign: "center",
                                width: "100%",
                            } },
                            react.createElement(MovePlayerLeft, { players: players, player: player, disabled: movableDisabled }),
                            react.createElement("span", { style: movableDisabled === true
                                    ? { cursor: "not-allowed", opacity: 0.4 }
                                    : { cursor: "pointer" }, onClick: function (_) {
                                    if (movableDisabled !== true) {
                                        send({ Action: { MakeObserver: player.id } });
                                    }
                                } }, "\u2714\uFE0F"),
                            react.createElement(MovePlayerRight, { players: players, player: player, disabled: movableDisabled })))));
                }),
                observers.map(function (player) {
                    var className = classnames_default()("player observer", { movable: movable });
                    var descriptor = makeDescriptor(player);
                    if (ownNames.has(player.name)) {
                        descriptor.push(" (You!)");
                    }
                    return (react.createElement("td", { key: player.id, className: className },
                        react.createElement("span", { style: { textDecoration: "line-through" } }, descriptor),
                        movable && (react.createElement("span", { style: {
                                display: "block",
                                marginTop: "6px",
                                textAlign: "center",
                                width: "100%",
                            } },
                            react.createElement("span", { style: movableDisabled === true
                                    ? { cursor: "not-allowed", opacity: 0.4 }
                                    : { cursor: "pointer" }, onClick: function (_) {
                                    if (movableDisabled !== true) {
                                        send({ Action: { MakePlayer: player.id } });
                                    }
                                } }, "\uD83D\uDCA4")))));
                })))));
};
/* harmony default export */ const src_Players = (Players);

;// ./src/ScoringSettings.tsx
var ScoringSettings_assign = (undefined && undefined.__assign) || function () {
    ScoringSettings_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return ScoringSettings_assign.apply(this, arguments);
};
var ScoringSettings_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var ScoringSettings_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};




var GameScoringSettings = function (props) {
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var engine = useEngine();
    var _a = react.useState(null), highlighted = _a[0], setHighlighted = _a[1];
    var _b = react.useState([]), scoreTransitions = _b[0], setScoreTransitions = _b[1];
    var _c = react.useState([]), bonusScoreTransitions = _c[0], setBonusScoreTransitions = _c[1];
    var _d = react.useState(10), stepSize = _d[0], setStepSize = _d[1];
    var _e = react.useState(100), totalPoints = _e[0], setTotalPoints = _e[1];
    var _f = react.useState(true), isLoading = _f[0], setIsLoading = _f[1];
    var updateSettings = function (updates) {
        send({
            Action: {
                SetGameScoringParameters: ScoringSettings_assign(ScoringSettings_assign({}, props.params), updates),
            },
        });
    };
    var bonusEnabled = props.params.bonus_level_policy === "BonusLevelForSmallerLandlordTeam";
    react.useEffect(function () {
        setIsLoading(true);
        // Load regular scoring
        var loadScoring = function () { return ScoringSettings_awaiter(void 0, void 0, void 0, function () {
            var regularKey, regular, bonusKey, bonus, error_1;
            return ScoringSettings_generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        regularKey = (0,cachePrefill/* getExplainScoringKey */.O3)(props.params, false, props.decks);
                        regular = cachePrefill/* explainScoringCache */.L9[regularKey];
                        if (!!regular) return [3 /*break*/, 2];
                        return [4 /*yield*/, engine.explainScoring({
                                params: props.params,
                                smaller_landlord_team_size: false,
                                decks: props.decks,
                            })];
                    case 1:
                        regular = _a.sent();
                        cachePrefill/* explainScoringCache */.L9[regularKey] = regular;
                        _a.label = 2;
                    case 2:
                        setScoreTransitions(regular.results);
                        setStepSize(regular.step_size);
                        setTotalPoints(regular.total_points);
                        if (!bonusEnabled) return [3 /*break*/, 5];
                        bonusKey = (0,cachePrefill/* getExplainScoringKey */.O3)(props.params, true, props.decks);
                        bonus = cachePrefill/* explainScoringCache */.L9[bonusKey];
                        if (!!bonus) return [3 /*break*/, 4];
                        return [4 /*yield*/, engine.explainScoring({
                                params: props.params,
                                smaller_landlord_team_size: true,
                                decks: props.decks,
                            })];
                    case 3:
                        bonus = _a.sent();
                        cachePrefill/* explainScoringCache */.L9[bonusKey] = bonus;
                        _a.label = 4;
                    case 4:
                        setBonusScoreTransitions(bonus.results);
                        return [3 /*break*/, 6];
                    case 5:
                        setBonusScoreTransitions(regular.results);
                        _a.label = 6;
                    case 6:
                        setIsLoading(false);
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Error explaining scoring:", error_1);
                        // Set defaults
                        setScoreTransitions([]);
                        setBonusScoreTransitions([]);
                        setStepSize(10);
                        setTotalPoints(100);
                        setIsLoading(false);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        loadScoring();
    }, [props.params, props.decks, bonusEnabled, engine]);
    if (isLoading) {
        return (react.createElement(react.Fragment, null,
            react.createElement("div", null, "Loading scoring settings...")));
    }
    var scoreSegments = [];
    var maxPts = 0;
    var maxLandlordDelta = 0;
    var maxNonLandlordDelta = 0;
    if (scoreTransitions.length > 0) {
        for (var i = 1; i < scoreTransitions.length; i++) {
            var span = Math.max(scoreTransitions[i].point_threshold -
                scoreTransitions[i - 1].point_threshold, 10);
            var segment = scoreTransitions[i - 1];
            maxLandlordDelta = Math.max(segment.results.landlord_delta, maxLandlordDelta);
            maxNonLandlordDelta = Math.max(segment.results.non_landlord_delta, maxNonLandlordDelta);
            scoreSegments.push({
                span: span,
                segment: segment,
                bonusSegment: bonusScoreTransitions.length > i - 1 &&
                    bonusScoreTransitions[i - 1].results.landlord_bonus
                    ? bonusScoreTransitions[i - 1]
                    : null,
            });
            maxPts += span;
        }
        var last = scoreTransitions.length - 1;
        scoreSegments.push({
            span: 5 * props.decks.length,
            segment: scoreTransitions[last],
            bonusSegment: bonusScoreTransitions.length > last &&
                bonusScoreTransitions[last].results.landlord_bonus
                ? bonusScoreTransitions[last]
                : null,
        });
        maxPts += 5 * props.decks.length;
        maxNonLandlordDelta = Math.max(scoreTransitions[last].results.non_landlord_delta, maxNonLandlordDelta);
        maxLandlordDelta = Math.max(scoreTransitions[last].results.landlord_delta, maxLandlordDelta);
    }
    var text = function (idx) {
        var txt = "Attacking team wins, but doesn't level up.";
        var segment = scoreSegments[idx];
        if (segment.segment.results.landlord_won) {
            txt = "Defending team wins, and goes up ".concat(segment.segment.results.landlord_delta, " level").concat(segment.segment.results.landlord_delta === 1 ? "" : "s", ".");
            if (segment.bonusSegment !== null) {
                txt += " If the team is unexpectedly small, they go up ".concat(segment.bonusSegment.results.landlord_delta, " level").concat(segment.bonusSegment.results.landlord_delta === 1 ? "" : "s", ".");
            }
        }
        else if (segment.segment.results.non_landlord_delta > 0) {
            txt = "Attacking team wins, and goes up ".concat(segment.segment.results.non_landlord_delta, " level").concat(segment.segment.results.non_landlord_delta === 1 ? "" : "s", ".");
        }
        return react.createElement(react.Fragment, null, txt);
    };
    var validStepSizes = [];
    for (var curStepSize = 0; curStepSize <= totalPoints / 3; curStepSize += 5 * props.decks.length) {
        if (curStepSize === 0) {
            continue;
        }
        if (totalPoints % curStepSize === 0) {
            validStepSizes.push("".concat(curStepSize));
        }
    }
    var maxSteps = Math.floor(totalPoints / stepSize);
    return (react.createElement(react.Fragment, null,
        react.createElement("div", null,
            react.createElement("div", { style: { width: "95%", padding: "5px 0 5px 0" } },
                scoreSegments.map(function (segment, idx) {
                    var frac = segment.span / maxPts;
                    var bg = "rgb(255, 255, 0)";
                    if (segment.segment.results.landlord_won) {
                        var f = segment.segment.results.landlord_delta / maxLandlordDelta;
                        bg = "rgba(0, 255, 0, ".concat(f, ")");
                    }
                    else if (segment.segment.results.non_landlord_delta > 0) {
                        var f = segment.segment.results.non_landlord_delta /
                            maxNonLandlordDelta;
                        bg = "rgba(255, 0, 0, ".concat(f, ")");
                    }
                    return (react.createElement("div", { key: idx, onMouseEnter: function (_) {
                            setHighlighted(idx);
                        }, onMouseLeave: function (_) {
                            setHighlighted(null);
                        }, style: {
                            width: "".concat(100 * frac, "%"),
                            background: bg,
                            padding: "5px 0 5px 0",
                            display: "inline-block",
                            cursor: "pointer",
                        } }, segment.segment.point_threshold));
                }),
                highlighted !== null ? (react.createElement("p", null,
                    " ",
                    text(highlighted))) : (react.createElement("p", null, "Hover over the scores above for more details."))),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Step size: ",
                    stepSize,
                    " points")),
            react.createElement("div", null,
                react.createElement("label", null, "Base step size: "),
                react.createElement("select", { value: "".concat(props.params.step_size_per_deck * props.decks.length), onChange: function (evt) {
                        evt.preventDefault();
                        var perDeck = parseInt(evt.target.value, 10) / props.decks.length;
                        updateSettings({
                            step_size_per_deck: perDeck,
                        });
                    } }, validStepSizes.map(function (ss, idx) { return (react.createElement("option", { key: idx }, ss)); })),
                " ",
                "(default: ",
                20 * props.decks.length,
                ")"),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Adjustment to step size for ",
                    props.decks.length,
                    " decks:",
                    " "),
                react.createElement("select", { value: props.params.step_adjustments[props.decks.length] !== undefined
                        ? props.params.step_adjustments[props.decks.length]
                        : "none", onChange: function (evt) {
                        var _a;
                        evt.preventDefault();
                        if (evt.target.value === "none") {
                            var _b = props.params.step_adjustments, _c = props.decks.length, _1 = _b[_c], adjustments = __rest(_b, [typeof _c === "symbol" ? _c : _c + ""]);
                            updateSettings({ step_adjustments: adjustments });
                        }
                        else {
                            var adjustments = ScoringSettings_assign(ScoringSettings_assign({}, props.params.step_adjustments), (_a = {}, _a[props.decks.length] = parseInt(evt.target.value, 10), _a));
                            updateSettings({ step_adjustments: adjustments });
                        }
                    } },
                    react.createElement("option", { key: "none" }, "none"),
                    Array((props.params.step_size_per_deck * props.decks.length) / 5)
                        .fill(undefined)
                        .map(function (_, idx) { return (react.createElement("option", { key: idx }, (idx + 1) * 5)); })),
                " ",
                "(default: none)"),
            react.createElement("div", null,
                react.createElement("label", null, "Number of steps where nobody gains a level: "),
                react.createElement("select", { value: "".concat(props.params.deadzone_size), onChange: function (evt) {
                        evt.preventDefault();
                        var deadzoneSize = parseInt(evt.target.value, 10);
                        updateSettings({
                            deadzone_size: deadzoneSize,
                        });
                    } }, Array(Math.max(maxSteps, props.params.deadzone_size))
                    .fill(undefined)
                    .map(function (_, idx) { return (react.createElement("option", { key: idx }, idx)); })),
                " ",
                "(default: 1)"),
            react.createElement("div", null,
                react.createElement("label", null, "Number of steps for the attacking team to win: "),
                react.createElement("select", { value: "".concat(props.params.num_steps_to_non_landlord_turnover), onChange: function (evt) {
                        evt.preventDefault();
                        var steps = parseInt(evt.target.value, 10);
                        updateSettings({
                            num_steps_to_non_landlord_turnover: steps,
                        });
                    } }, Array(Math.max(maxSteps, props.params.num_steps_to_non_landlord_turnover))
                    .fill(undefined)
                    .map(function (_, idx) { return (react.createElement("option", { key: idx + 1 }, idx + 1)); })),
                " ",
                "(default: 2)"),
            react.createElement("div", null,
                react.createElement("label", null, "Grant a bonus level for unexpectedly small team"),
                " ",
                react.createElement("input", { id: "small-team-bonus", type: "checkbox", onChange: function (evt) {
                        evt.preventDefault();
                        updateSettings({
                            bonus_level_policy: evt.target.checked
                                ? "BonusLevelForSmallerLandlordTeam"
                                : "NoBonusLevel",
                        });
                    }, checked: bonusEnabled })))));
};

;// ./src/Initialize.tsx
var Initialize_assign = (undefined && undefined.__assign) || function () {
    Initialize_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return Initialize_assign.apply(this, arguments);
};
var Initialize_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Initialize_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Initialize_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};


















var Initialize_Picker = react.lazy(function () { return Initialize_awaiter(void 0, void 0, void 0, function () { return Initialize_generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 4063))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); });
/// The ranks a match can be played to. The server rejects anything below 3.
// prettier-ignore
var firstToRankOptions = [
    '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'NT'
];
var Initialize_contentStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "80%",
    transform: "translate(-50%, -50%)",
};
var DifficultySettings = function (props) {
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    var s = (react.createElement(react.Fragment, null,
        react.createElement("div", null,
            react.createElement("label", null,
                "Friend selection restriction:",
                " ",
                react.createElement("select", { value: props.state.propagated.friend_selection_policy, onChange: props.setFriendSelectionPolicy },
                    react.createElement("option", { value: "Unrestricted" }, "Non-trump cards"),
                    react.createElement("option", { value: "TrumpsIncluded" }, "All cards, including trumps"),
                    react.createElement("option", { value: "HighestCardNotAllowed" }, "Non-trump cards, except the highest"),
                    react.createElement("option", { value: "PointCardNotAllowed" }, "Non-trump, non-point cards (except K when playing A)")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Multiple joining policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.multiple_join_policy, onChange: props.setMultipleJoinPolicy },
                    react.createElement("option", { value: "Unrestricted" }, "Players can join the defending team multiple times."),
                    react.createElement("option", { value: "NoDoubleJoin" }, "Each player can only join the defending team once.")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Rank advancement policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.advancement_policy, onChange: props.setAdvancementPolicy },
                    react.createElement("option", { value: "Unrestricted" }, "A must be defended"),
                    react.createElement("option", { value: "FullyUnrestricted" }, "Unrestricted"),
                    react.createElement("option", { value: "DefendPoints" }, "Points (5, 10, K) and A must be defended")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Max rank:",
                " ",
                react.createElement("select", { value: props.state.propagated.max_rank, onChange: props.setMaxRank, disabled: props.matchInProgress },
                    react.createElement("option", { value: "NT" }, "No trump"),
                    react.createElement("option", { value: "A" }, "A")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Point visibility:",
                " ",
                react.createElement("select", { value: props.state.propagated.hide_landlord_points ? "hide" : "show", onChange: props.setHideLandlordsPoints },
                    react.createElement("option", { value: "show" }, "Show all players' points"),
                    react.createElement("option", { value: "hide" }, "Hide defending team's points")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Played card visibility (in chat):",
                " ",
                react.createElement("select", { value: props.state.propagated.hide_played_cards ? "hide" : "show", onChange: props.setHidePlayedCards },
                    react.createElement("option", { value: "show" }, "Show played cards in chat"),
                    react.createElement("option", { value: "hide" }, "Hide played cards in chat")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Penalty for points left in the bottom:",
                " ",
                react.createElement("select", { value: props.state.propagated.kitty_penalty, onChange: props.setKittyPenalty },
                    react.createElement("option", { value: "Times" }, "Twice the size of the last trick"),
                    react.createElement("option", { value: "Power" }, "Two to the power of the size of the last trick")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Penalty for incorrect throws:",
                " ",
                react.createElement("select", { value: props.state.propagated.throw_penalty, onChange: props.setThrowPenalty },
                    react.createElement("option", { value: "None" }, "No penalty"),
                    react.createElement("option", { value: "TenPointsPerAttempt" }, "Ten points per bad throw")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Play takeback:",
                " ",
                react.createElement("select", { value: props.state.propagated.play_takeback_policy, onChange: props.setPlayTakebackPolicy },
                    react.createElement("option", { value: "AllowPlayTakeback" }, "Allow taking back plays"),
                    react.createElement("option", { value: "NoPlayTakeback" }, "Disallow taking back plays")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Bid takeback:",
                " ",
                react.createElement("select", { value: props.state.propagated.bid_takeback_policy, onChange: props.setBidTakebackPolicy },
                    react.createElement("option", { value: "AllowBidTakeback" }, "Allow bid takeback"),
                    react.createElement("option", { value: "NoBidTakeback" }, "No bid takeback"))))));
    return (react.createElement("div", null,
        react.createElement("label", null,
            "Difficulty settings:",
            " ",
            react.createElement("button", { className: "normal", onClick: function (evt) {
                    evt.preventDefault();
                    setModalOpen(true);
                } }, "Open"),
            react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: Initialize_contentStyle } }, s))));
};
var DeckSettings = function (props) {
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    var isNotDefault = function (d) {
        return !(d.min === "2" && !d.exclude_big_joker && !d.exclude_small_joker);
    };
    var onChange = function (decks) {
        // exclude the decks that are the same as default
        var filtered = decks.filter(function (d) { return isNotDefault(d); });
        props.setSpecialDecks(filtered);
    };
    var setDeckAtIndex = function (deck, index) {
        var newDecks = Initialize_spreadArray([], props.decks, true);
        newDecks[index] = deck;
        onChange(newDecks);
    };
    var numbers = [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
        "A",
    ];
    var s = (react.createElement(react.Fragment, null, props.decks.map(function (d, i) { return (react.createElement("div", { key: i, style: {
            display: "inline-block",
            border: "1px solid #000",
            padding: "5px",
            margin: "5px",
        } },
        "Deck ",
        i + 1,
        isNotDefault(d) ? " (modified)" : " (standard)",
        react.createElement("form", null,
            react.createElement("label", { style: { display: "block" } },
                "Include HJ (\u5927\u738B)",
                " ",
                react.createElement("input", { type: "checkbox", checked: !d.exclude_big_joker, onChange: function (evt) {
                        return setDeckAtIndex(Initialize_assign(Initialize_assign({}, d), { exclude_big_joker: !evt.target.checked }), i);
                    } })),
            react.createElement("label", { style: { display: "block" } },
                "Include LJ (\u5C0F\u738B)",
                " ",
                react.createElement("input", { type: "checkbox", checked: !d.exclude_small_joker, onChange: function (evt) {
                        return setDeckAtIndex(Initialize_assign(Initialize_assign({}, d), { exclude_small_joker: !evt.target.checked }), i);
                    } })),
            react.createElement("label", null,
                "Minimum card:",
                " ",
                react.createElement("select", { value: d.min, onChange: function (evt) {
                        return setDeckAtIndex(Initialize_assign(Initialize_assign({}, d), { min: evt.target.value }), i);
                    } }, numbers.map(function (n) { return (react.createElement("option", { key: n, value: n }, n)); })))))); })));
    return (react.createElement("div", null,
        react.createElement("label", null,
            "More deck customization:",
            " ",
            react.createElement("button", { className: "normal", onClick: function (evt) {
                    evt.preventDefault();
                    setModalOpen(true);
                } }, "Open"),
            react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: Initialize_contentStyle } }, s))));
};
var TractorRequirementsE = function (props) {
    return (react.createElement("div", null,
        react.createElement("label", null, "Tractor requirements: "),
        react.createElement("input", { type: "number", style: { width: "3em" }, onChange: function (v) {
                return props.onChange(Initialize_assign(Initialize_assign({}, props.tractorRequirements), { min_count: v.target.valueAsNumber }));
            }, value: props.tractorRequirements.min_count, min: "2", max: props.numDecks }),
        react.createElement("label", null, " cards wide by "),
        react.createElement("input", { type: "number", style: { width: "3em" }, onChange: function (v) {
                return props.onChange(Initialize_assign(Initialize_assign({}, props.tractorRequirements), { min_length: v.target.valueAsNumber }));
            }, value: props.tractorRequirements.min_length, min: "2", max: "12" }),
        react.createElement("label", null, " tuples long")));
};
var ScoringSettings = function (props) {
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    return (react.createElement("div", null,
        react.createElement("label", null,
            "Scoring settings:",
            " ",
            react.createElement("button", { className: "normal", onClick: function (evt) {
                    evt.preventDefault();
                    setModalOpen(true);
                } }, "Open"),
            react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: Initialize_contentStyle } },
                react.createElement(GameScoringSettings, { params: props.state.propagated.game_scoring_parameters, decks: props.decks })))));
};
var UncommonSettings = function (props) {
    var _a, _b, _c;
    var _d = react.useState(false), modalOpen = _d[0], setModalOpen = _d[1];
    var s = (react.createElement(react.Fragment, null,
        react.createElement("div", null,
            react.createElement("label", null,
                "Game shadowing policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.game_shadowing_policy, onChange: props.setGameShadowingPolicy },
                    react.createElement("option", { value: "AllowMultipleSessions" }, "Allow players to be shadowed by joining with the same name"),
                    react.createElement("option", { value: "SingleSessionOnly" }, "Do not allow players to be shadowed")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Game start policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.game_start_policy, onChange: props.setGameStartPolicy },
                    react.createElement("option", { value: "AllowAnyPlayer" }, "Allow any player to start a game"),
                    react.createElement("option", { value: "AllowLandlordOnly" }, "Allow only landlord to start a game")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Landlord selection from bid:",
                " ",
                react.createElement("select", { value: props.state.propagated.first_landlord_selection_policy, onChange: props.setFirstLandlordSelectionPolicy },
                    react.createElement("option", { value: "ByWinningBid" }, "Winning bid decides both landlord and trump"),
                    react.createElement("option", { value: "ByFirstBid" }, "First bid decides landlord, winning bid decides trump")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Trump policy for cards revealed from the bottom:",
                " ",
                react.createElement("select", { value: props.state.propagated.kitty_bid_policy, onChange: props.setKittyBidPolicy },
                    react.createElement("option", { value: "FirstCard" }, "First card revealed"),
                    react.createElement("option", { value: "FirstCardOfLevelOrHighest" }, "First card revealed of the appropriate rank")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Bid policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.bid_policy, onChange: props.setBidPolicy },
                    react.createElement("option", { value: "JokerOrHigherSuit" }, "Joker or higher suit bids to outbid non-joker bids with the same number of cards"),
                    react.createElement("option", { value: "JokerOrGreaterLength" }, "Joker bids to outbid non-joker bids with the same number of cards"),
                    react.createElement("option", { value: "GreaterLength" }, "All bids must have more cards than the previous bids")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Bid reinforcement policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.bid_reinforcement_policy, onChange: props.setBidReinforcementPolicy },
                    react.createElement("option", { value: "ReinforceWhileWinning" }, "The current winning bid can be reinforced"),
                    react.createElement("option", { value: "ReinforceWhileEquivalent" }, "A bid can be reinforced after it is overturned"),
                    react.createElement("option", { value: "OverturnOrReinforceWhileWinning" }, "The current winning bid can be overturned by the same bidder")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Joker bid policy:",
                " ",
                react.createElement("select", { value: props.state.propagated.joker_bid_policy, onChange: props.setJokerBidPolicy },
                    react.createElement("option", { value: "BothTwoOrMore" }, "At least two jokers (or number of decks) to bid no trump"),
                    react.createElement("option", { value: "BothNumDecks" }, "All the low or high jokers to bid no trump"),
                    react.createElement("option", { value: "LJNumDecksHJNumDecksLessOne" }, "All the low jokers or all but one high joker to bid no trump"),
                    react.createElement("option", { value: "Disabled" }, "No trump / joker bids disabled")))),
        react.createElement(TractorRequirementsE, { tractorRequirements: props.state.propagated.tractor_requirements, numDecks: props.numDecksEffective, onChange: function (req) { return props.setTractorRequirements(req); } }),
        props.numDecksEffective >= 4 && (react.createElement("div", null,
            react.createElement("label", null,
                "Bomb cards (4+ identical cards beat any play of the same size):",
                " ",
                react.createElement("select", { value: (_a = props.state.propagated.bomb_policy) !== null && _a !== void 0 ? _a : "NoBombs", onChange: props.setBombPolicy },
                    react.createElement("option", { value: "NoBombs" }, "Disabled"),
                    react.createElement("option", { value: "AllowBombs" }, "Enabled (any suit, no suit-following required)"),
                    react.createElement("option", { value: "AllowBombsSuitFollowing" }, "Enabled (must follow suit)"))))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Rainbow tricks (same rank across \u22654 suits):",
                " ",
                react.createElement("select", { value: ((_b = props.state.propagated.compound_formats) === null || _b === void 0 ? void 0 : _b.rainbows) != null
                        ? "enabled"
                        : "disabled", onChange: function (evt) {
                        var _a, _b, _c;
                        if (evt.target.value === "enabled") {
                            props.setCompoundFormats({
                                rainbows: (_b = (_a = props.state.propagated.compound_formats) === null || _a === void 0 ? void 0 : _a.rainbows) !== null && _b !== void 0 ? _b : ((_c = props.state.propagated.num_decks) !== null && _c !== void 0 ? _c : 2) * 2 + 1,
                            });
                        }
                        else {
                            props.setCompoundFormats({ rainbows: null });
                        }
                    } },
                    react.createElement("option", { value: "disabled" }, "Disabled"),
                    react.createElement("option", { value: "enabled" }, "Enabled"))),
            ((_c = props.state.propagated.compound_formats) === null || _c === void 0 ? void 0 : _c.rainbows) != null && (react.createElement("label", null,
                " ",
                "Minimum cards:",
                " ",
                react.createElement("input", { type: "number", min: 4, value: props.state.propagated.compound_formats.rainbows, onChange: function (evt) {
                        var n = parseInt(evt.target.value, 10);
                        if (!isNaN(n) && n >= 4) {
                            props.setCompoundFormats({ rainbows: n });
                        }
                    } })))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Should reveal kitty at end of game:",
                " ",
                react.createElement("select", { value: props.state.propagated.should_reveal_kitty_at_end_of_game
                        ? "show"
                        : "hide", onChange: props.setShouldRevealKittyAtEndOfGame },
                    react.createElement("option", { value: "hide" }, "Do not reveal contents of the kitty at the end of the game in chat"),
                    react.createElement("option", { value: "show" }, "Reveal contents of the kitty at the end of the game in chat")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Show player which defeats throw:",
                " ",
                react.createElement("select", { value: props.state.propagated.hide_throw_halting_player ? "hide" : "show", onChange: props.setHideThrowHaltingPlayer },
                    react.createElement("option", { value: "hide" }, "Hide the player who defeats a potential throw"),
                    react.createElement("option", { value: "show" }, "Show the player who defeats a potential throw")))),
        react.createElement("div", null,
            react.createElement("label", null,
                "Jacks variation:",
                " ",
                react.createElement("select", { value: props.state.propagated.jack_variation, onChange: props.setJackVariation },
                    react.createElement("option", { value: "SingleJack" }, "Winning the last trick with a single J will set the leader's team to rank 2"),
                    react.createElement("option", { value: "Disabled" }, "Disable the J variation"))))));
    return (react.createElement("div", null,
        react.createElement("label", null,
            "More game settings:",
            " ",
            react.createElement("button", { className: "normal", onClick: function (evt) {
                    evt.preventDefault();
                    setModalOpen(true);
                } }, "Open"),
            react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: Initialize_contentStyle } }, s))));
};
var Initialize = function (props) {
    var _a;
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var _b = react.useState(false), showPicker = _b[0], setShowPicker = _b[1];
    var setGameMode = function (evt) {
        evt.preventDefault();
        if (evt.target.value === "Tractor") {
            send({ Action: { SetGameMode: "Tractor" } });
        }
        else {
            send({
                Action: {
                    SetGameMode: {
                        FindingFriends: {
                            num_friends: null,
                        },
                    },
                },
            });
        }
    };
    var setNumFriends = function (evt) {
        evt.preventDefault();
        if (evt.target.value === "") {
            send({
                Action: {
                    SetGameMode: {
                        FindingFriends: {
                            num_friends: null,
                        },
                    },
                },
            });
        }
        else {
            var num = parseInt(evt.target.value, 10);
            send({
                Action: {
                    SetGameMode: {
                        FindingFriends: {
                            num_friends: num,
                        },
                    },
                },
            });
        }
    };
    var onSelectString = function (action) {
        return function (evt) {
            var _a;
            evt.preventDefault();
            if (evt.target.value !== "") {
                send({ Action: (_a = {}, _a[action] = evt.target.value, _a) });
            }
        };
    };
    var onSelectStringDefault = function (action, defaultValue) {
        return function (evt) {
            var _a, _b;
            evt.preventDefault();
            if (evt.target.value !== "") {
                send({ Action: (_a = {}, _a[action] = evt.target.value, _a) });
            }
            else {
                send({ Action: (_b = {}, _b[action] = defaultValue, _b) });
            }
        };
    };
    var setFriendSelectionPolicy = onSelectString("SetFriendSelectionPolicy");
    var setMultipleJoinPolicy = onSelectString("SetMultipleJoinPolicy");
    var setFirstLandlordSelectionPolicy = onSelectString("SetFirstLandlordSelectionPolicy");
    var setBidPolicy = onSelectString("SetBidPolicy");
    var setBidReinforcementPolicy = onSelectString("SetBidReinforcementPolicy");
    var setJokerBidPolicy = onSelectString("SetJokerBidPolicy");
    var setKittyTheftPolicy = onSelectString("SetKittyTheftPolicy");
    var setKittyBidPolicy = onSelectString("SetKittyBidPolicy");
    var setTrickDrawPolicy = onSelectString("SetTrickDrawPolicy");
    var setThrowEvaluationPolicy = onSelectString("SetThrowEvaluationPolicy");
    var setPlayTakebackPolicy = onSelectString("SetPlayTakebackPolicy");
    var setGameShadowingPolicy = onSelectString("SetGameShadowingPolicy");
    var setGameStartPolicy = onSelectString("SetGameStartPolicy");
    var setBidTakebackPolicy = onSelectString("SetBidTakebackPolicy");
    var setGameVisibility = onSelectString("SetGameVisibility");
    var setShouldRevealKittyAtEndOfGame = function (evt) {
        evt.preventDefault();
        if (evt.target.value !== "") {
            send({
                Action: {
                    SetShouldRevealKittyAtEndOfGame: evt.target.value === "show",
                },
            });
        }
    };
    var setHideThrowHaltingPlayer = function (evt) {
        evt.preventDefault();
        if (evt.target.value !== "") {
            send({
                Action: {
                    SetHideThrowHaltingPlayer: evt.target.value === "hide",
                },
            });
        }
    };
    var setJackVariation = function (evt) {
        evt.preventDefault();
        if (evt.target.value !== "") {
            send({
                Action: {
                    SetJackVariation: evt.target.value,
                },
            });
        }
    };
    var setBombPolicy = onSelectString("SetBombPolicy");
    var setKittyPenalty = onSelectStringDefault("SetKittyPenalty", null);
    var setAdvancementPolicy = onSelectStringDefault("SetAdvancementPolicy", "Unrestricted");
    var setMaxRank = onSelectStringDefault("SetMaxRank", "NT");
    var setThrowPenalty = onSelectStringDefault("SetThrowPenalty", null);
    var setHideLandlordsPoints = function (evt) {
        evt.preventDefault();
        send({ Action: { SetHideLandlordsPoints: evt.target.value === "hide" } });
    };
    var setHidePlayedCards = function (evt) {
        evt.preventDefault();
        send({ Action: { SetHidePlayedCards: evt.target.value === "hide" } });
    };
    var setRated = function (evt) {
        evt.preventDefault();
        send({ Action: { SetRated: evt.target.value === "yes" } });
    };
    var setFirstToRank = function (evt) {
        evt.preventDefault();
        if (evt.target.value !== "") {
            send({ Action: { SetFirstToRank: evt.target.value } });
        }
    };
    // 1v1 rooms: two users, each controlling both seats of one team. The mode
    // is fixed by the server when the room is created; Tractor only, no
    // reordering / observer juggling.
    var oneVsOne = props.state.propagated.player_mode === "OneVsOne";
    // `rated` defaults to true on the server (serde default).
    var rated = isRated(props.state.propagated);
    var firstToRank = firstToRankOf(props.state.propagated);
    var roundsFinished = roundsFinishedOf(props.state.propagated);
    // A match is in progress once one of its rounds has finished. Everything
    // that defines the match is frozen until it ends (the server rejects it).
    var matchInProgress = roundsFinished > 0;
    var startVotes = (_a = props.state.propagated.start_votes) !== null && _a !== void 0 ? _a : [];
    var startGame = function (evt) {
        evt.preventDefault();
        send({ Action: "StartGame" });
    };
    var setEmoji = function (emoji) {
        send({
            Action: {
                SetLandlordEmoji: emoji,
            },
        });
    };
    var modeAsString = props.state.propagated.game_mode === "Tractor"
        ? "Tractor"
        : "FindingFriends";
    var numFriends = props.state.propagated.game_mode === "Tractor" ||
        props.state.propagated.game_mode.FindingFriends.num_friends === null
        ? ""
        : props.state.propagated.game_mode.FindingFriends.num_friends;
    var decksEffective = props.state.propagated.num_decks !== undefined &&
        props.state.propagated.num_decks !== null &&
        props.state.propagated.num_decks > 0
        ? props.state.propagated.num_decks
        : Math.max(Math.floor(props.state.propagated.players.length / 2), 1);
    var decks = Initialize_spreadArray([], (props.state.propagated.special_decks || []), true);
    while (decks.length < decksEffective) {
        decks.push({
            exclude_big_joker: false,
            exclude_small_joker: false,
            min: "2",
        });
    }
    decks.length = decksEffective;
    var currentPlayer = props.state.propagated.players.find(function (p) { return p.name === props.name; });
    if (currentPlayer === undefined) {
        currentPlayer = props.state.propagated.observers.find(function (p) { return p.name === props.name; });
    }
    if (currentPlayer === undefined) {
        currentPlayer = {
            id: -1,
            name: props.name,
            level: "",
            metalevel: 0,
        };
    }
    var landlordIndex = props.state.propagated.players.findIndex(function (p) { return p.id === props.state.propagated.landlord; });
    // The first round of a match needs every player to click start; later
    // rounds just need one click. Clicking again once you have voted is
    // harmless, so the button stays enabled either way.
    var alreadyVotedToStart = currentPlayer.id >= 0 && startVotes.includes(currentPlayer.id);
    var startProgress = "".concat(startVotes.length, "/").concat(props.state.propagated.players.length);
    var startLabel = matchInProgress
        ? "Start next round"
        : alreadyVotedToStart
            ? "You're ready \u2014 waiting for the others (".concat(startProgress, ")")
            : "Start match (".concat(startProgress, " ready)");
    var saveGameSettings = function (evt) {
        evt.preventDefault();
        localStorage.setItem("gameSettingsInLocalStorage", JSON.stringify(props.state.propagated));
    };
    var setGameSettings = function (gameSettings) {
        if (gameSettings !== null) {
            var kittySizeSet = false;
            var kittySize = null;
            for (var _i = 0, _a = Object.entries(gameSettings); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                switch (key) {
                    case "game_mode":
                        // 1v1 rooms are always Tractor; the server rejects anything else.
                        if (!oneVsOne) {
                            send({
                                Action: {
                                    SetGameMode: value,
                                },
                            });
                        }
                        break;
                    case "rated":
                        send({
                            Action: {
                                SetRated: value === undefined || value === null || value,
                            },
                        });
                        break;
                    case "first_to_rank":
                        if (value !== undefined && value !== null && value !== "") {
                            send({
                                Action: {
                                    SetFirstToRank: value,
                                },
                            });
                        }
                        break;
                    case "player_mode":
                        // Fixed when the room is created; there is no client action.
                        break;
                    case "num_decks":
                        send({
                            Action: {
                                SetNumDecks: value,
                            },
                        });
                        if (kittySizeSet) {
                            // reset the size again, as setting deck num resets kitty_size to default
                            send({
                                Action: {
                                    SetKittySize: kittySize,
                                },
                            });
                        }
                        break;
                    case "special_decks":
                        send({
                            Action: {
                                SetSpecialDecks: value,
                            },
                        });
                        break;
                    case "kitty_size":
                        send({
                            Action: {
                                SetKittySize: value,
                            },
                        });
                        kittySizeSet = true;
                        kittySize = value;
                        break;
                    case "friend_selection_policy":
                        send({
                            Action: {
                                SetFriendSelectionPolicy: value,
                            },
                        });
                        break;
                    case "multiple_join_policy":
                        send({
                            Action: {
                                SetMultipleJoinPolicy: value,
                            },
                        });
                        break;
                    case "first_landlord_selection_policy":
                        send({
                            Action: {
                                SetFirstLandlordSelectionPolicy: value,
                            },
                        });
                        break;
                    case "hide_landlord_points":
                        send({
                            Action: {
                                SetHideLandlordsPoints: value,
                            },
                        });
                        break;
                    case "hide_played_cards":
                        send({ Action: { SetHidePlayedCards: value } });
                        break;
                    case "advancement_policy":
                        send({
                            Action: {
                                SetAdvancementPolicy: value,
                            },
                        });
                        break;
                    case "max_rank":
                        send({
                            Action: {
                                SetMaxRank: value,
                            },
                        });
                        break;
                    case "kitty_bid_policy":
                        send({
                            Action: {
                                SetKittyBidPolicy: value,
                            },
                        });
                        break;
                    case "kitty_penalty":
                        send({
                            Action: {
                                SetKittyPenalty: value,
                            },
                        });
                        break;
                    case "kitty_theft_policy":
                        send({
                            Action: {
                                SetKittyTheftPolicy: value,
                            },
                        });
                        break;
                    case "throw_penalty":
                        send({
                            Action: {
                                SetThrowPenalty: value,
                            },
                        });
                        break;
                    case "trick_draw_policy":
                        send({
                            Action: {
                                SetTrickDrawPolicy: value,
                            },
                        });
                        break;
                    case "throw_evaluation_policy":
                        send({
                            Action: {
                                SetThrowEvaluationPolicy: value,
                            },
                        });
                        break;
                    case "landlord_emoji":
                        send({
                            Action: {
                                SetLandlordEmoji: value,
                            },
                        });
                        break;
                    case "bid_policy":
                        send({
                            Action: {
                                SetBidPolicy: value,
                            },
                        });
                        break;
                    case "bid_reinforcement_policy":
                        send({
                            Action: {
                                SetBidReinforcementPolicy: value,
                            },
                        });
                        break;
                    case "joker_bid_policy":
                        send({
                            Action: {
                                SetJokerBidPolicy: value,
                            },
                        });
                        break;
                    case "should_reveal_kitty_at_end_of_game":
                        send({
                            Action: {
                                SetShouldRevealKittyAtEndOfGame: value,
                            },
                        });
                        break;
                    case "hide_throw_halting_player":
                        send({ Action: { SetHideThrowHaltingPlayer: value } });
                        break;
                    case "jack_variation":
                        send({ Action: { SetJackVariation: value } });
                        break;
                    case "game_scoring_parameters":
                        send({
                            Action: {
                                SetGameScoringParameters: value,
                            },
                        });
                        break;
                    case "play_takeback_policy":
                        send({
                            Action: {
                                SetPlayTakebackPolicy: value,
                            },
                        });
                        break;
                    case "bid_takeback_policy":
                        send({
                            Action: {
                                SetBidTakebackPolicy: value,
                            },
                        });
                        break;
                    case "game_shadowing_policy":
                        send({
                            Action: {
                                SetGameShadowingPolicy: value,
                            },
                        });
                        break;
                    case "game_start_policy":
                        send({
                            Action: {
                                SetGameStartPolicy: value,
                            },
                        });
                        break;
                    case "tractor_requirements":
                        send({
                            Action: {
                                SetTractorRequirements: value,
                            },
                        });
                        break;
                    case "game_visibility":
                        send({
                            Action: {
                                SetGameVisibility: value,
                            },
                        });
                        break;
                    case "compound_formats":
                        send({
                            Action: {
                                SetCompoundFormats: value,
                            },
                        });
                        break;
                }
            }
        }
    };
    var loadGameSettings = function (evt) {
        evt.preventDefault();
        var settings = localStorage.getItem("gameSettingsInLocalStorage");
        if (settings !== null) {
            var gameSettings_1;
            try {
                gameSettings_1 = JSON.parse(settings);
                var fetchAsync = function () { return Initialize_awaiter(void 0, void 0, void 0, function () {
                    var fetchResult, fetchJSON, combined;
                    return Initialize_generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetch((0,api/* apiUrl */.y0)("default_settings.json"))];
                            case 1:
                                fetchResult = _a.sent();
                                return [4 /*yield*/, fetchResult.json()];
                            case 2:
                                fetchJSON = _a.sent();
                                combined = Initialize_assign(Initialize_assign({}, fetchJSON), gameSettings_1);
                                if (combined.bonus_level_policy !== undefined &&
                                    combined.game_scoring_parameters !== undefined &&
                                    combined.bonus_level_policy !==
                                        combined.game_scoring_parameters.bonus_level_policy) {
                                    combined.game_scoring_parameters.bonus_level_policy =
                                        combined.bonus_level_policy;
                                }
                                setGameSettings(combined);
                                return [2 /*return*/];
                        }
                    });
                }); };
                fetchAsync().catch(function (e) {
                    console.error(e);
                    localStorage.setItem("gameSettingsInLocalStorage", JSON.stringify(props.state.propagated));
                });
            }
            catch (_a) {
                localStorage.setItem("gameSettingsInLocalStorage", JSON.stringify(props.state.propagated));
            }
        }
    };
    var resetGameSettings = function (evt) {
        evt.preventDefault();
        var fetchAsync = function () { return Initialize_awaiter(void 0, void 0, void 0, function () {
            var fetchResult, fetchJSON;
            return Initialize_generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch((0,api/* apiUrl */.y0)("default_settings.json"))];
                    case 1:
                        fetchResult = _a.sent();
                        return [4 /*yield*/, fetchResult.json()];
                    case 2:
                        fetchJSON = _a.sent();
                        setGameSettings(fetchJSON);
                        return [2 /*return*/];
                }
            });
        }); };
        fetchAsync().catch(function (e) { return console.error(e); });
    };
    return (react.createElement("div", null,
        react.createElement(src_Header, { gameMode: props.state.propagated.game_mode, chatLink: props.state.propagated.chat_link }),
        react.createElement(src_Players, { players: props.state.propagated.players, observers: props.state.propagated.observers, landlord: props.state.propagated.landlord, next: null, movable: !oneVsOne, movableDisabled: matchInProgress, name: props.name }),
        react.createElement("p", null,
            "Send link to other players to allow them to join the game:",
            " ",
            react.createElement("a", { href: window.location.href, target: "_blank", rel: "noreferrer" },
                react.createElement("code", null, window.location.href))),
        matchInProgress && (react.createElement("p", { className: "match-in-progress" },
            "Match in progress \u2014 first to rank ",
            firstToRank,
            ", round",
            " ",
            roundsFinished + 1)),
        props.state.propagated.players.length >= 4 ? (react.createElement(react.Fragment, null,
            react.createElement("button", { className: "big", disabled: props.state.propagated.game_start_policy ===
                    "AllowLandlordOnly" &&
                    landlordIndex !== -1 &&
                    props.state.propagated.players[landlordIndex].name !== props.name, onClick: startGame, title: matchInProgress
                    ? "Deal the next round of this match"
                    : "The first round of a match starts once every player has clicked start" }, startLabel),
            react.createElement(src_ReadyCheck, null))) : (react.createElement("h2", null, "Waiting for players...")),
        oneVsOne ? null : (react.createElement(RandomizePlayersButton, { players: props.state.propagated.players, disabled: matchInProgress }, "Randomize player order")),
        react.createElement(src_Kicker, { players: props.state.propagated.players, onKick: function (playerId) { return send({ Kick: playerId }); } }),
        react.createElement("div", { className: "game-settings" },
            react.createElement("h3", null, "Game settings"),
            matchInProgress && (react.createElement("p", { className: "auth-hint" }, "A match is in progress, so the settings that define it (rated, first to rank, game mode, ranks, the leader and the player order) are locked until it ends.")),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Rated:",
                    " ",
                    react.createElement("select", { value: rated ? "yes" : "no", onChange: setRated, disabled: matchInProgress },
                        react.createElement("option", { value: "yes" },
                            "Yes (the match counts on the ",
                            oneVsOne ? "1v1" : "team",
                            " ladder)"),
                        react.createElement("option", { value: "no" }, "No (casual, ratings unchanged)")))),
            react.createElement("div", null,
                react.createElement("label", null,
                    "First to rank:",
                    " ",
                    react.createElement("select", { value: firstToRank, onChange: setFirstToRank, disabled: matchInProgress }, firstToRankOptions.map(function (rank) { return (react.createElement("option", { value: rank, key: rank }, rank)); })),
                    " ",
                    react.createElement("span", { className: "auth-hint" }, "(the match ends when someone reaches this rank)"))),
            react.createElement("div", null, oneVsOne ? (react.createElement("label", null,
                "Game mode: ",
                react.createElement("strong", null, "1v1 room"),
                " (\u5347\u7EA7 / Tractor; each player controls both seats of their team)")) : (react.createElement("label", null,
                "Game mode:",
                " ",
                react.createElement("select", { value: modeAsString, onChange: setGameMode, disabled: matchInProgress },
                    react.createElement("option", { value: "Tractor" }, "\u5347\u7EA7 / Tractor"),
                    react.createElement("option", { value: "FindingFriends" }, "\u627E\u670B\u53CB / Finding Friends"))))),
            react.createElement("div", null, !oneVsOne && props.state.propagated.game_mode !== "Tractor" ? (react.createElement("label", null,
                "Number of friends:",
                " ",
                react.createElement("select", { value: numFriends, onChange: setNumFriends, disabled: matchInProgress },
                    react.createElement("option", { value: "" }, "default"),
                    array.range(Math.max(Math.floor(props.state.propagated.players.length / 2) - 1, 0), function (idx) { return (react.createElement("option", { value: idx + 1, key: idx }, idx + 1)); })))) : null),
            react.createElement(src_NumDecksSelector, { numPlayers: props.state.propagated.players.length, numDecks: props.state.propagated.num_decks, onChange: function (newNumDecks) {
                    return send({ Action: { SetNumDecks: newNumDecks } });
                } }),
            react.createElement(DeckSettings, { decks: decks, setSpecialDecks: function (d) { return send({ Action: { SetSpecialDecks: d } }); } }),
            react.createElement(src_KittySizeSelector, { numPlayers: props.state.propagated.players.length, decks: decks, kittySize: props.state.propagated.kitty_size, onChange: function (newKittySize) {
                    return send({ Action: { SetKittySize: newKittySize } });
                } }),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Bids after cards are exchanged from the bottom:",
                    " ",
                    react.createElement("select", { value: props.state.propagated.kitty_theft_policy, onChange: setKittyTheftPolicy },
                        react.createElement("option", { value: "AllowKittyTheft" }, "Allowed (\u7092\u5730\u76AE)"),
                        react.createElement("option", { value: "NoKittyTheft" }, "Not allowed")))),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Card protection policy:",
                    " ",
                    react.createElement("select", { value: props.state.propagated.trick_draw_policy, onChange: setTrickDrawPolicy },
                        react.createElement("option", { value: "NoProtections" }, "No protections"),
                        react.createElement("option", { value: "LongerTuplesProtected" }, "Longer tuple (triple) is protected from shorter (pair)"),
                        react.createElement("option", { value: "OnlyDrawTractorOnTractor" }, "Only tractors can draw tractors"),
                        react.createElement("option", { value: "LongerTuplesProtectedAndOnlyDrawTractorOnTractor" }, "Longer tuples are protected from shorter, and only tractors can draw tractors"),
                        react.createElement("option", { value: "NoFormatBasedDraw" }, "No format-based requirements (pairs do not draw pairs)")))),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Multi-throw evaluation policy:",
                    " ",
                    react.createElement("select", { value: props.state.propagated.throw_evaluation_policy, onChange: setThrowEvaluationPolicy },
                        react.createElement("option", { value: "All" }, "Subsequent throw must beat all cards to win"),
                        react.createElement("option", { value: "Highest" }, "Subsequent throw must beat highest card to win"),
                        react.createElement("option", { value: "TrickUnitLength" }, "Subsequent throw must beat largest component to win")))),
            react.createElement(ScoringSettings, { state: props.state, decks: decks }),
            react.createElement(UncommonSettings, { state: props.state, numDecksEffective: decksEffective, setBidPolicy: setBidPolicy, setBidReinforcementPolicy: setBidReinforcementPolicy, setJokerBidPolicy: setJokerBidPolicy, setShouldRevealKittyAtEndOfGame: setShouldRevealKittyAtEndOfGame, setHideThrowHaltingPlayer: setHideThrowHaltingPlayer, setFirstLandlordSelectionPolicy: setFirstLandlordSelectionPolicy, setGameStartPolicy: setGameStartPolicy, setGameShadowingPolicy: setGameShadowingPolicy, setKittyBidPolicy: setKittyBidPolicy, setJackVariation: setJackVariation, setTractorRequirements: function (requirements) {
                    return send({ Action: { SetTractorRequirements: requirements } });
                }, setBombPolicy: setBombPolicy, setCompoundFormats: function (formats) {
                    return send({ Action: { SetCompoundFormats: formats } });
                } }),
            react.createElement(DifficultySettings, { state: props.state, matchInProgress: matchInProgress, setFriendSelectionPolicy: setFriendSelectionPolicy, setMultipleJoinPolicy: setMultipleJoinPolicy, setAdvancementPolicy: setAdvancementPolicy, setMaxRank: setMaxRank, setHideLandlordsPoints: setHideLandlordsPoints, setHidePlayedCards: setHidePlayedCards, setKittyPenalty: setKittyPenalty, setThrowPenalty: setThrowPenalty, setPlayTakebackPolicy: setPlayTakebackPolicy, setBidTakebackPolicy: setBidTakebackPolicy }),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Game Visibility",
                    " ",
                    react.createElement("select", { value: props.state.propagated.game_visibility, onChange: setGameVisibility },
                        react.createElement("option", { value: "Unlisted" }, "Unlisted"),
                        react.createElement("option", { value: "Public" }, "Public")))),
            react.createElement("h3", null, "Continuation settings"),
            react.createElement(src_LandlordSelector, { players: props.state.propagated.players, landlordId: props.state.propagated.landlord, onChange: function (newLandlord) {
                    return send({ Action: { SetLandlord: newLandlord } });
                }, disabled: matchInProgress }),
            react.createElement(src_RankSelector, { rank: currentPlayer.level, metaRank: currentPlayer.metalevel, onChangeRank: function (newRank) {
                    return send({ Action: { SetRank: newRank } });
                }, onChangeMetaRank: function (newMetaRank) {
                    return send({ Action: { SetMetaRank: newMetaRank } });
                }, disabled: matchInProgress }),
            react.createElement("h3", null, "Misc settings"),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Landlord label:",
                    " ",
                    props.state.propagated.landlord_emoji !== null &&
                        props.state.propagated.landlord_emoji !== undefined &&
                        props.state.propagated.landlord_emoji !== ""
                        ? props.state.propagated.landlord_emoji
                        : "当庄",
                    " ",
                    react.createElement("button", { className: "normal", onClick: function () {
                            setShowPicker(!showPicker);
                        } }, showPicker ? "Hide" : "Pick"),
                    react.createElement("button", { className: "normal", disabled: props.state.propagated.landlord_emoji == null, onClick: function () {
                            send({ Action: { SetLandlordEmoji: null } });
                        } }, "Default"),
                    showPicker ? (react.createElement(react.Suspense, { fallback: "..." },
                        react.createElement(Initialize_Picker, { onEmojiClick: function (ecd) { return setEmoji(ecd.emoji); }, emojiStyle: emoji_picker_react_esm.EmojiStyle.NATIVE }))) : null)),
            react.createElement("div", null,
                react.createElement("label", null,
                    "Setting Management:",
                    react.createElement("button", { className: "normal", "data-tooltip-id": "saveTip", "data-tooltip-content": "Save game settings", onClick: saveGameSettings }, "Save"),
                    react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "saveTip", place: "top" }),
                    react.createElement("button", { className: "normal", "data-tooltip-id": "loadTip", "data-tooltip-content": "Load saved game settings", onClick: loadGameSettings }, "Load"),
                    react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "loadTip", place: "top" }),
                    react.createElement("button", { className: "normal", "data-tooltip-id": "resetTip", "data-tooltip-content": "Reset game settings to defaults", "data-ti": "resetTip", onClick: resetGameSettings }, "Reset"),
                    react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "resetTip", place: "top" }))))));
};
/* harmony default export */ const src_Initialize = (Initialize);

;// ./src/BeepButton.tsx


var BeepButton = function () {
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    return (react.createElement("button", { className: "big", onClick: function () {
            return confirm("Do you really want to send a beep to the current player?") &&
                send("Beep");
        } }, "\uD83D\uDECE\uFE0F"));
};
/* harmony default export */ const src_BeepButton = (BeepButton);

;// ./src/Cards.tsx
var Cards_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Cards_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Cards_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};






var Cards = function (props) {
    var _a = react.useState(null), highlightedSuit = _a[0], setHighlightedSuit = _a[1];
    var _b = react.useState([]), selectedCardGroups = _b[0], setSelectedCardGroups = _b[1];
    var _c = react.useState([]), unselectedCardGroups = _c[0], setUnselectedCardGroups = _c[1];
    var _d = react.useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var hands = props.hands, selectedCards = props.selectedCards, notifyEmpty = props.notifyEmpty;
    var engine = useEngine();
    var _e = react.useContext(SettingsContext), separateCardsBySuit = _e.separateCardsBySuit, disableSuitHighlights = _e.disableSuitHighlights, reverseCardOrder = _e.reverseCardOrder;
    var handleSelect = function (card) { return function () {
        if (props.onCardClick !== undefined) {
            props.onCardClick(card);
        }
        if (selectedCards !== undefined && props.onSelect !== undefined) {
            props.onSelect(Cards_spreadArray(Cards_spreadArray([], selectedCards, true), [card], false));
        }
    }; };
    var handleUnselect = function (card) { return function () {
        if (selectedCards !== undefined) {
            var index = selectedCards.indexOf(card);
            if (index >= 0 && props.onSelect) {
                props.onSelect(array.minus(selectedCards, [card]));
            }
        }
    }; };
    var cardsInHand = props.playerId in hands.hands
        ? Object.entries(hands.hands[props.playerId]).flatMap(function (_a) {
            var c = _a[0], ct = _a[1];
            return Array(ct).fill(c);
        })
        : [];
    var unselected = selectedCards === undefined
        ? cardsInHand
        : array.minus(cardsInHand, selectedCards);
    // Create stable string representation of the player's hand for dependency checking
    // This prevents re-running the effect when hands.hands object reference changes
    // but the actual cards remain the same
    var handKey = react.useMemo(function () {
        if (!(props.playerId in hands.hands)) {
            return "";
        }
        // Create a stable key from the hand object (card -> count mapping)
        return Object.entries(hands.hands[props.playerId])
            .sort(function (_a, _b) {
            var a = _a[0];
            var b = _b[0];
            return a.localeCompare(b);
        })
            .map(function (_a) {
            var card = _a[0], count = _a[1];
            return "".concat(card, ":").concat(count);
        })
            .join(",");
    }, [hands.hands, props.playerId]);
    // Load sorted cards when they change
    react.useEffect(function () {
        setIsLoading(true);
        var loadSortedCards = function () { return Cards_awaiter(void 0, void 0, void 0, function () {
            var selectedGroups, sorted, unselectedGroups, sorted, error_1, fallbackSelected, fallbackUnselected;
            return Cards_generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        selectedGroups = [];
                        if (!(props.selectedCards !== undefined &&
                            props.selectedCards.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, engine.sortAndGroupCards({
                                cards: props.selectedCards,
                                trump: props.trump,
                            })];
                    case 1:
                        sorted = _a.sent();
                        selectedGroups = sorted.map(function (g) {
                            return g.cards.map(function (c) { return ({
                                card: c,
                                suit: g.suit,
                            }); });
                        });
                        _a.label = 2;
                    case 2:
                        unselectedGroups = [];
                        if (!(unselected.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, engine.sortAndGroupCards({
                                cards: unselected,
                                trump: props.trump,
                            })];
                    case 3:
                        sorted = _a.sent();
                        unselectedGroups = sorted.map(function (g) {
                            return g.cards.map(function (c) { return ({
                                card: c,
                                suit: g.suit,
                            }); });
                        });
                        _a.label = 4;
                    case 4:
                        // Apply grouping settings
                        if (!separateCardsBySuit) {
                            selectedGroups =
                                selectedGroups.length > 0 ? [selectedGroups.flatMap(function (g) { return g; })] : [];
                            unselectedGroups =
                                unselectedGroups.length > 0
                                    ? [unselectedGroups.flatMap(function (g) { return g; })]
                                    : [];
                        }
                        if (reverseCardOrder) {
                            unselectedGroups.reverse();
                            unselectedGroups.forEach(function (g) { return g.reverse(); });
                        }
                        setSelectedCardGroups(selectedGroups);
                        setUnselectedCardGroups(unselectedGroups);
                        setIsLoading(false);
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error("Error sorting cards:", error_1);
                        fallbackSelected = props.selectedCards
                            ? [props.selectedCards.map(function (c) { return ({ card: c, suit: null }); })]
                            : [];
                        fallbackUnselected = [
                            unselected.map(function (c) { return ({ card: c, suit: null }); }),
                        ];
                        setSelectedCardGroups(fallbackSelected);
                        setUnselectedCardGroups(fallbackUnselected);
                        setIsLoading(false);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        loadSortedCards();
    }, [
        props.selectedCards,
        props.trump,
        props.playerId,
        handKey, // Use the stable key instead of hands.hands
        separateCardsBySuit,
        reverseCardOrder,
        engine,
    ]);
    if (isLoading) {
        return (react.createElement("div", { className: "hand" },
            react.createElement("div", null, "Loading cards...")));
    }
    return (react.createElement("div", { className: "hand" },
        props.selectedCards !== undefined ? (react.createElement("div", { className: "selected-cards" },
            selectedCardGroups.map(function (g, gidx) { return (react.createElement("div", { style: { display: "inline-block" }, key: gidx }, g.map(function (c, idx) { return (react.createElement(src_Card, { key: "".concat(gidx, "-").concat(idx), onClick: handleUnselect(c.card), trump: props.trump, card: c.card, collapseRight: idx !== g.length - 1 })); }))); }),
            props.selectedCards.length === 0 && (react.createElement(src_Card, { card: "\uD83C\uDCA0", trump: props.trump, className: classnames_default()({ notify: notifyEmpty }) })))) : null,
        react.createElement("div", { className: classnames_default()("unselected-cards", {
                unclickable: props.onSelect === undefined && props.onCardClick === undefined,
            }) },
            unselectedCardGroups.map(function (g, gidx) { return (react.createElement("div", { style: { display: "inline-block" }, key: gidx }, g.map(function (c, idx) { return (react.createElement(src_Card, { key: "".concat(gidx, "-").concat(idx), className: classnames_default()(!disableSuitHighlights && highlightedSuit === c.suit
                    ? "highlighted"
                    : null), onClick: handleSelect(c.card), card: c.card, collapseRight: idx !== g.length - 1, trump: props.trump, onMouseEnter: function (_) { return setHighlightedSuit(c.suit); }, onMouseLeave: function (_) { return setHighlightedSuit(null); } })); }))); }),
            unselectedCardGroups.length === 0 && (react.createElement(src_Card, { trump: props.trump, card: "\uD83C\uDCA0" })))));
};
/* harmony default export */ const src_Cards = (Cards);

;// ./src/BidArea.tsx





var BidArea = function (props) {
    var _a, _b;
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var engine = useEngine();
    var _c = react.useState([]), validBids = _c[0], setValidBids = _c[1];
    var _d = react.useState(false), isLoadingBids = _d[0], setIsLoadingBids = _d[1];
    var trump = props.trump == null ? { NoTrump: {} } : props.trump;
    var takeBackBid = function (evt) {
        evt.preventDefault();
        send({ Action: "TakeBackBid" });
    };
    var players = {};
    var playerId = -1;
    props.players.forEach(function (p) {
        players[p.id] = p;
        if (p.name === props.name) {
            playerId = p.id;
        }
    });
    // Load valid bids when player is not a spectator
    react.useEffect(function () {
        if (playerId >= 0) {
            setIsLoadingBids(true);
            engine
                .findValidBids({
                id: playerId,
                bids: props.bids,
                hands: props.hands,
                players: props.players,
                landlord: props.landlord,
                epoch: props.epoch,
                bid_policy: props.bidPolicy,
                bid_reinforcement_policy: props.bidReinforcementPolicy,
                joker_bid_policy: props.jokerBidPolicy,
                num_decks: props.numDecks,
            })
                .then(function (bids) {
                // Sort the bids
                bids.sort(function (a, b) {
                    if (a.card < b.card) {
                        return -1;
                    }
                    else if (a.card > b.card) {
                        return 1;
                    }
                    else if (a.count < b.count) {
                        return -1;
                    }
                    else if (a.count > b.count) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
                setValidBids(bids);
                setIsLoadingBids(false);
            })
                .catch(function (error) {
                console.error("Error finding valid bids:", error);
                setValidBids([]);
                setIsLoadingBids(false);
            });
        }
    }, [
        playerId,
        props.bids,
        props.hands,
        props.players,
        props.landlord,
        props.epoch,
        props.bidPolicy,
        props.bidReinforcementPolicy,
        props.jokerBidPolicy,
        props.numDecks,
        engine,
    ]);
    if (playerId === null || playerId < 0) {
        // Spectator mode
        return (react.createElement("div", null,
            props.header,
            props.autobid !== null ? (react.createElement(src_LabeledPlay, { label: "".concat(players[props.autobid.id].name, " (from bottom)"), trump: trump, cards: [props.autobid.card] })) : null,
            props.bids.map(function (bid, idx) {
                var name = players[bid.id].name;
                return (react.createElement(src_LabeledPlay, { label: name, key: idx, trump: trump, cards: Array(bid.count).fill(bid.card) }));
            }),
            props.bids.length === 0 && props.autobid === null ? (react.createElement(src_LabeledPlay, { trump: trump, label: "No bids yet...", cards: ["🂠"] })) : null));
    }
    else {
        var levelId = props.landlord !== null && props.landlord !== undefined
            ? props.landlord
            : playerId;
        var trump_1 = props.trump !== null && props.trump !== undefined
            ? props.trump
            : {
                NoTrump: {
                    number: players[levelId].level !== "NT" ? players[levelId].level : null,
                },
            };
        return (react.createElement("div", null,
            react.createElement("div", null,
                props.header,
                props.autobid !== null ? (react.createElement(src_LabeledPlay, { label: "".concat(players[props.autobid.id].name, " (from bottom)"), cards: [props.autobid.card], trump: trump_1 })) : null,
                props.bids.map(function (bid, idx) {
                    var name = players[bid.id].name;
                    return (react.createElement(src_LabeledPlay, { label: name, key: idx, trump: trump_1, cards: Array(bid.count).fill(bid.card) }));
                }),
                props.trump !== undefined &&
                    "NoTrump" in props.trump &&
                    ((_b = (_a = props.trump) === null || _a === void 0 ? void 0 : _a.NoTrump) === null || _b === void 0 ? void 0 : _b.number) === null ? (react.createElement(react.Fragment, null, "No bidding in no trump!")) : props.bids.length === 0 && props.autobid === null ? (react.createElement(src_LabeledPlay, { trump: trump_1, label: "No bids yet...", cards: ["🂠"] })) : null),
            props.prefixButtons,
            props.bidTakeBacksEnabled ? (react.createElement("button", { onClick: takeBackBid, disabled: props.bids.length === 0 ||
                    props.bids[props.bids.length - 1].id !== playerId ||
                    props.bids[props.bids.length - 1].epoch !== props.epoch, className: "big" }, "Take back bid")) : null,
            props.suffixButtons,
            isLoadingBids ? (react.createElement("p", null, "Loading bid options...")) : validBids.length > 0 ? (react.createElement("p", null, "Click a bid option to bid")) : (react.createElement("p", null, "No available bids!")),
            !isLoadingBids &&
                validBids.map(function (bid, idx) {
                    return (react.createElement(src_LabeledPlay, { trump: trump_1, cards: Array(bid.count).fill(bid.card), key: idx, label: "Bid option ".concat(idx + 1), onClick: function () {
                            send({ Action: { Bid: [bid.card, bid.count] } });
                        } }));
                }),
            react.createElement(src_Cards, { hands: props.hands, playerId: playerId, trump: trump_1 })));
    }
};
/* harmony default export */ const src_BidArea = (BidArea);

;// ./src/Draw.tsx
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Draw_assign = (undefined && undefined.__assign) || function () {
    Draw_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return Draw_assign.apply(this, arguments);
};
/* tslint:disable:max-classes-per-file variable-name forin */








/// Who should act next in the Draw phase: the player at `position` while
/// cards remain, otherwise the last bidder (who picks up the kitty).
var drawNextPlayer = function (state) {
    if (state.deck.length === 0 && state.bids.length > 0) {
        return state.bids[state.bids.length - 1].id;
    }
    return state.propagated.players[state.position].id;
};
/// Delay before re-sending a draw for a state we already drew from (the
/// previous draw is either still in flight or was rejected).
var AUTODRAW_RETRY_MS = 1000;
var DrawInner = /** @class */ (function (_super) {
    __extends(DrawInner, _super);
    function DrawInner(props) {
        var _this = _super.call(this, props) || this;
        _this.timeout = null;
        /// The draw-state key the pending timer was armed for.
        _this.timerKey = null;
        /// The draw-state key at the time of the last `DrawCard` we sent.
        _this.lastSentKey = null;
        _this.drawCardAudio = null;
        _this.state = {
            autodraw: true,
        };
        _this.drawCard = _this.drawCard.bind(_this);
        _this.pickUpKitty = _this.pickUpKitty.bind(_this);
        _this.revealCard = _this.revealCard.bind(_this);
        _this.onAutodrawClicked = _this.onAutodrawClicked.bind(_this);
        return _this;
    }
    DrawInner.prototype.componentDidMount = function () {
        this.armAutodraw();
    };
    DrawInner.prototype.componentDidUpdate = function () {
        this.armAutodraw();
    };
    DrawInner.prototype.componentWillUnmount = function () {
        this.cancelTimer();
    };
    DrawInner.prototype.cancelTimer = function () {
        if (this.timeout !== null) {
            this.props.clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.timerKey = null;
    };
    DrawInner.prototype.canDraw = function () {
        return (this.props.state.propagated.players[this.props.state.position].name ===
            this.props.name && this.props.state.deck.length > 0);
    };
    /// Identifies "the draw we are about to make": changes after every
    /// successful draw by anyone.
    DrawInner.prototype.drawKey = function () {
        return "".concat(this.props.state.position, ":").concat(this.props.state.deck.length);
    };
    /// (Re-)arm the autodraw timer whenever drawing is possible and no timer is
    /// pending for the current state. This is deliberately not gated on a
    /// false -> true transition of `canDraw`: if a draw is rejected by the
    /// server (the state does not change but an error arrives), the next
    /// update re-arms it and the draw self-recovers. A re-arm for a state we
    /// already sent a draw for uses a longer delay, so a re-render while the
    /// draw is in flight does not fire a duplicate.
    DrawInner.prototype.armAutodraw = function () {
        var _this = this;
        if (!this.canDraw() || !this.state.autodraw) {
            return;
        }
        var key = this.drawKey();
        if (this.timeout !== null) {
            if (this.timerKey === key) {
                return;
            }
            // The state advanced while a (retry) timer was pending: replace it
            // with a timer at the normal speed.
            this.cancelTimer();
        }
        var speed = this.props.autodrawSpeedMs !== null ? this.props.autodrawSpeedMs : 10;
        var delay = key === this.lastSentKey ? Math.max(speed, AUTODRAW_RETRY_MS) : speed;
        this.timerKey = key;
        this.timeout = this.props.setTimeout(function () {
            _this.timeout = null;
            _this.timerKey = null;
            _this.drawCard();
        }, delay);
    };
    DrawInner.prototype.drawCard = function () {
        var canDraw = this.props.state.propagated.players[this.props.state.position].name ===
            this.props.name;
        this.cancelTimer();
        if (canDraw) {
            this.lastSentKey = this.drawKey();
            if (this.props.playDrawCardSound) {
                if (this.drawCardAudio === null) {
                    this.drawCardAudio = new Audio("434472_dersuperanton_taking-card.mp3");
                }
                this.drawCardAudio.play();
            }
            this.props.send({ Action: "DrawCard" });
        }
    };
    DrawInner.prototype.pickUpKitty = function (evt) {
        evt.preventDefault();
        this.props.send({ Action: "PickUpKitty" });
    };
    DrawInner.prototype.revealCard = function (evt) {
        evt.preventDefault();
        this.props.send({ Action: "RevealCard" });
    };
    DrawInner.prototype.onAutodrawClicked = function (evt) {
        this.setState({
            autodraw: evt.target.checked,
        });
        if (evt.target.checked) {
            this.drawCard();
        }
        else {
            this.cancelTimer();
        }
    };
    DrawInner.prototype.render = function () {
        var _this = this;
        var canDraw = this.canDraw();
        var next = drawNextPlayer(this.props.state);
        var players = {};
        var playerId = -1;
        this.props.state.propagated.players.forEach(function (p) {
            players[p.id] = p;
            if (p.name === _this.props.name) {
                playerId = p.id;
            }
        });
        var landlord = this.props.state.propagated.landlord;
        var trump;
        if (landlord !== null &&
            landlord !== undefined &&
            players[landlord] !== undefined) {
            trump = {
                NoTrump: {
                    number: players[landlord].level !== "NT" &&
                        players[landlord].level !== undefined &&
                        players[landlord].level !== null
                        ? players[landlord].level
                        : null,
                },
            };
        }
        return (react.createElement("div", null,
            this.props.compact ? null : (react.createElement(react.Fragment, null,
                react.createElement(src_Header, { gameMode: this.props.state.game_mode, chatLink: this.props.state.propagated.chat_link }),
                react.createElement(src_Players, { players: this.props.state.propagated.players, observers: this.props.state.propagated.observers, landlord: landlord, next: next, name: this.props.name }))),
            react.createElement(src_BidArea, { bids: this.props.state.bids, autobid: this.props.state.autobid, hands: this.props.state.hands, epoch: 0, name: this.props.name, trump: trump, landlord: landlord, players: this.props.state.propagated.players, bidPolicy: this.props.state.propagated.bid_policy, bidReinforcementPolicy: this.props.state.propagated.bid_reinforcement_policy, jokerBidPolicy: this.props.state.propagated.joker_bid_policy, numDecks: this.props.state.num_decks, header: react.createElement(react.Fragment, null,
                    react.createElement("h2", null,
                        "Bids (",
                        this.props.state.deck.length,
                        " cards remaining in the deck)"),
                    !this.props.compact &&
                        this.props.state.removed_cards.length > 0 ? (react.createElement("p", null,
                        "Note:",
                        " ",
                        this.props.state.removed_cards.map(function (c) { return (react.createElement(src_InlineCard, { key: c, card: c })); }),
                        " ",
                        "have been removed from the deck")) : null), prefixButtons: react.createElement(react.Fragment, null,
                    react.createElement("button", { onClick: function (evt) {
                            evt.preventDefault();
                            _this.drawCard();
                        }, disabled: !canDraw, className: "big" }, "Draw card"),
                    react.createElement("label", null,
                        "auto-draw",
                        react.createElement("input", { type: "checkbox", name: "autodraw", checked: this.state.autodraw, onChange: this.onAutodrawClicked }))), suffixButtons: react.createElement(react.Fragment, null,
                    react.createElement("button", { onClick: this.pickUpKitty, disabled: this.props.state.deck.length > 0 ||
                            (this.props.state.bids.length === 0 &&
                                this.props.state.autobid === null &&
                                !(landlord !== null &&
                                    landlord !== undefined &&
                                    players[landlord].level === "NT")) ||
                            (landlord !== null && landlord !== playerId) ||
                            (landlord === null &&
                                ((this.props.state.propagated
                                    .first_landlord_selection_policy === "ByWinningBid" &&
                                    this.props.state.bids[this.props.state.bids.length - 1]
                                        .id !== playerId) ||
                                    (this.props.state.propagated
                                        .first_landlord_selection_policy === "ByFirstBid" &&
                                        this.props.state.bids[0].id !== playerId))), className: "big" }, "Pick up cards from the bottom"),
                    react.createElement("button", { onClick: this.revealCard, disabled: landlord === null ||
                            landlord === undefined ||
                            this.props.state.deck.length > 0 ||
                            this.props.state.bids.length > 0 ||
                            this.props.state.autobid !== null ||
                            (this.props.state.revealed_cards || 0) >=
                                this.props.state.kitty.length ||
                            (landlord !== null &&
                                landlord !== undefined &&
                                players[landlord].level === "NT"), className: "big" }, "Reveal card from the bottom"),
                    react.createElement(src_BeepButton, null)), bidTakeBacksEnabled: this.props.state.propagated.bid_takeback_policy ===
                    "AllowBidTakeback" }),
            this.props.compact ? null : (react.createElement(src_LabeledPlay, { className: "kitty", cards: this.props.state.kitty, trump: { NoTrump: {} }, label: "\u5E95\u724C" }))));
    };
    return DrawInner;
}(react.Component));
/// Reads the (possibly seat-bound) `send` from context and hands it to the
/// class component above.
var Draw = function (props) {
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    return react.createElement(DrawInner, Draw_assign({}, props, { send: send }));
};
/* harmony default export */ const src_Draw = (Draw);

;// ./src/Trump.tsx



var TrumpE = function (props) {
    var trump = props.trump;
    if ("Standard" in trump) {
        var _a = trump.Standard, suit_1 = _a.suit, rank_1 = _a.number;
        var card = preloadedCards/* default */.A.filter(function (v) { return v.typ === suit_1 && v.number === rank_1; })[0].value;
        return (react.createElement("div", { className: "trump" },
            "The trump suit is ",
            react.createElement(src_InlineCard, { card: card }),
            " (rank ",
            rank_1,
            ")"));
    }
    else if (trump.NoTrump.number !== undefined &&
        trump.NoTrump.number !== null) {
        return react.createElement("div", { className: "trump" },
            "No trump, rank ",
            trump.NoTrump.number);
    }
    else {
        return react.createElement("div", { className: "trump" }, "No trump");
    }
};
/* harmony default export */ const Trump = (TrumpE);

// EXTERNAL MODULE: ./node_modules/react-select/dist/react-select.esm.js + 49 modules
var react_select_esm = __webpack_require__(1023);
;// ./src/FriendSelect.tsx
var FriendSelect_assign = (undefined && undefined.__assign) || function () {
    FriendSelect_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return FriendSelect_assign.apply(this, arguments);
};






var FriendSelect = function (props) {
    var handleChange = function (transform) { return function (value) {
        props.onChange(FriendSelect_assign({ card: props.friend.card, initial_skip: props.friend.initial_skip }, transform(value)));
    }; };
    var handleCardChange = handleChange(function (select) { return ({
        card: select.value,
    }); });
    var handleOrdinalChange = handleChange(function (select) { return ({
        initial_skip: parseInt(select.value, 10),
    }); });
    var rank = "Standard" in props.trump
        ? props.trump.Standard.number
        : props.trump.NoTrump.number;
    var cardOptions = [];
    var currentValue = {};
    if (props.friend.card !== "") {
        var c = cardLookup[props.friend.card];
        currentValue.label = "".concat(c.number).concat(c.typ);
        currentValue.value = c.value;
    }
    var notTrumpFilter = function (c) {
        var _a;
        return (c.number !== null &&
            c.number !== rank &&
            (!("Standard" in props.trump) || c.typ !== ((_a = props.trump.Standard) === null || _a === void 0 ? void 0 : _a.suit)));
    };
    var policyFilters = {
        PointCardNotAllowed: function (c) {
            return (notTrumpFilter(c) &&
                (c.points === 0 || (rank === "A" && c.number === "K")));
        },
        HighestCardNotAllowed: function (c) {
            return (notTrumpFilter(c) &&
                ((rank !== "A" && c.number !== "A") ||
                    (rank === "A" && c.number !== "K")));
        },
        Unrestricted: function (c) { return notTrumpFilter(c); },
        TrumpsIncluded: function (_) { return true; },
    };
    var policyFilter = policyFilters[props.friend_selection_policy];
    preloadedCards/* default */.A
        .filter(function (c) { return policyFilter(c); })
        .forEach(function (c) {
        return cardOptions.push({
            label: "".concat(c.number).concat(c.typ),
            value: c.value,
        });
    });
    return (react.createElement("div", { className: "friend-select" },
        react.createElement("div", { style: { width: "100px", display: "inline-block" } },
            react.createElement(react_select_esm/* default */.Ay, { value: currentValue, onChange: handleCardChange, options: cardOptions, formatOptionLabel: function (_a) {
                    var value = _a.value;
                    return value !== undefined && value !== null && value !== "" ? (react.createElement(src_InlineCard, { card: value })) : (value);
                } })),
        react.createElement("div", { style: { width: "100px", display: "inline-block", marginLeft: "10px" } },
            react.createElement(react_select_esm/* default */.Ay, { value: props.friend.initial_skip !== null
                    ? {
                        value: "".concat(props.friend.initial_skip),
                        label: "#".concat(props.friend.initial_skip + 1),
                    }
                    : undefined, onChange: handleOrdinalChange, options: array.range(props.num_decks, function (idx) {
                    return { value: "".concat(idx), label: "#".concat(idx + 1) };
                }) }))));
};
/* harmony default export */ const src_FriendSelect = (FriendSelect);

;// ./src/Friends.tsx


var Friends = function (props) {
    var gameMode = props.gameMode;
    if (gameMode !== "Tractor") {
        return (react.createElement("div", { className: "pending-friends" }, gameMode.FindingFriends.friends.map(function (friend, idx) {
            if (friend.player_id !== null) {
                return null;
            }
            if (friend.card === null ||
                friend.card === undefined ||
                friend.card.length === 0) {
                return null;
            }
            return (react.createElement("p", { key: idx },
                "The person to play the ",
                nth(friend.initial_skip + 1),
                " ",
                react.createElement(src_InlineCard, { card: friend.card }),
                " is a friend.",
                " ",
                props.showPlayed
                    ? "".concat(friend.initial_skip - friend.skip, " played in previous tricks.")
                    : ""));
        })));
    }
    else {
        return react.createElement(react.Fragment, null);
    }
};
function nth(n) {
    var suffix = ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1];
    return "".concat(n).concat(suffix !== undefined ? suffix : "th");
}
/* harmony default export */ const src_Friends = (Friends);

;// ./src/Exchange.tsx
var Exchange_extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Exchange_assign = (undefined && undefined.__assign) || function () {
    Exchange_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return Exchange_assign.apply(this, arguments);
};
var Exchange_spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/* tslint:disable:max-classes-per-file variable-name forin */















/// Who should act next in the Exchange phase: the exchanger while kitty
/// theft bidding is open, otherwise the landlord.
var exchangeNextPlayer = function (state) {
    var kittyTheftEnabled = state.propagated.kitty_theft_policy === "AllowKittyTheft";
    return kittyTheftEnabled &&
        !state.finalized &&
        state.exchanger !== null &&
        state.exchanger !== undefined
        ? state.exchanger
        : state.landlord;
};
// Wrapper component to handle cache prefilling with hooks, and to read the
// (possibly seat-bound) send function from context.
function ExchangeWrapper(props) {
    var engine = useEngine();
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    react.useEffect(function () {
        if (props.state.trump && engine) {
            // Prefill cache for trump in Exchange component
            (0,cachePrefill/* prefillCardInfoCache */.j9)(engine, props.state.trump);
        }
    }, [props.state.trump, engine]);
    return react.createElement(Exchange, Exchange_assign({}, props, { send: send }));
}
var Exchange = /** @class */ (function (_super) {
    Exchange_extends(Exchange, _super);
    function Exchange(props) {
        var _this = _super.call(this, props) || this;
        _this.moveCardToKitty = _this.moveCardToKitty.bind(_this);
        _this.moveCardToHand = _this.moveCardToHand.bind(_this);
        _this.startGame = _this.startGame.bind(_this);
        _this.pickUpKitty = _this.pickUpKitty.bind(_this);
        _this.putDownKitty = _this.putDownKitty.bind(_this);
        _this.pickFriends = _this.pickFriends.bind(_this);
        _this.state = {
            friends: [],
        };
        _this.fixFriends = _this.fixFriends.bind(_this);
        return _this;
    }
    Exchange.prototype.fixFriends = function () {
        if (this.props.state.game_mode !== "Tractor") {
            var gameMode = this.props.state.game_mode.FindingFriends;
            var numFriends = gameMode.num_friends;
            var propFriends = gameMode.friends;
            if (numFriends !== this.state.friends.length) {
                if (propFriends.length !== numFriends) {
                    var friends = Exchange_spreadArray([], this.state.friends, true);
                    while (friends.length < numFriends) {
                        friends.push({
                            card: "",
                            skip: 0,
                            initial_skip: 0,
                            player_id: null,
                        });
                    }
                    while (friends.length > numFriends) {
                        friends.pop();
                    }
                    this.setState({ friends: friends });
                }
                else {
                    this.setState({ friends: propFriends });
                }
            }
        }
        else {
            if (this.state.friends.length !== 0) {
                this.setState({ friends: [] });
            }
        }
    };
    Exchange.prototype.componentDidMount = function () {
        this.fixFriends();
    };
    Exchange.prototype.componentDidUpdate = function () {
        this.fixFriends();
    };
    Exchange.prototype.moveCardToKitty = function (card) {
        this.props.send({ Action: { MoveCardToKitty: card } });
    };
    Exchange.prototype.moveCardToHand = function (card) {
        this.props.send({ Action: { MoveCardToHand: card } });
    };
    Exchange.prototype.startGame = function (evt) {
        evt.preventDefault();
        this.props.send({ Action: "BeginPlay" });
    };
    Exchange.prototype.pickUpKitty = function (evt) {
        evt.preventDefault();
        this.props.send({ Action: "PickUpKitty" });
    };
    Exchange.prototype.putDownKitty = function (evt) {
        evt.preventDefault();
        this.props.send({ Action: "PutDownKitty" });
    };
    Exchange.prototype.pickFriends = function (evt) {
        evt.preventDefault();
        if (this.props.state.game_mode !== "Tractor" &&
            this.props.state.game_mode.FindingFriends.num_friends ===
                this.state.friends.length) {
            this.props.send({
                Action: {
                    SetFriends: this.state.friends,
                },
            });
        }
        else {
            this.fixFriends();
        }
    };
    Exchange.prototype.render = function () {
        var _this = this;
        var exchanger = this.props.state.exchanger === null
            ? this.props.state.landlord
            : this.props.state.exchanger;
        var landlordIdx = -1;
        var exchangerIdx = -1;
        var playerId = -1;
        this.props.state.propagated.players.forEach(function (player, idx) {
            if (player.id === _this.props.state.landlord) {
                landlordIdx = idx;
            }
            if (player.id === exchanger) {
                exchangerIdx = idx;
            }
            if (player.name === _this.props.name) {
                playerId = player.id;
            }
        });
        var isLandlord = this.props.state.propagated.players[landlordIdx].name === this.props.name;
        var isExchanger = this.props.state.propagated.players[exchangerIdx].name ===
            this.props.name;
        var kittyTheftEnabled = this.props.state.propagated.kitty_theft_policy === "AllowKittyTheft";
        var nextPlayer = exchangeNextPlayer(this.props.state);
        var exchangeUI = isExchanger && !this.props.state.finalized ? (react.createElement(react.Fragment, null,
            react.createElement("h2", null, "Your hand"),
            react.createElement(src_Cards, { hands: this.props.state.hands, playerId: playerId, onCardClick: function (c) { return _this.moveCardToKitty(c); }, trump: this.props.state.trump }),
            react.createElement("h2", null,
                "Discarded cards ",
                this.props.state.kitty.length,
                " /",
                " ",
                this.props.state.kitty_size),
            react.createElement("div", { className: "kitty" }, this.props.state.kitty.map(function (c, idx) { return (react.createElement(src_Card, { trump: _this.props.state.trump, key: idx, onClick: function () { return _this.moveCardToHand(c); }, collapseRight: idx !== _this.props.state.kitty.length - 1, card: c })); })),
            kittyTheftEnabled ? (react.createElement("button", { onClick: this.putDownKitty, disabled: this.props.state.kitty.length !== this.props.state.kitty_size, className: "big" }, "Finalize exchanged cards")) : null)) : null;
        var lastBid = this.props.state.bids[this.props.state.bids.length - 1];
        var startGame = (react.createElement("button", { onClick: this.startGame, disabled: this.props.state.kitty.length !== this.props.state.kitty_size ||
                (kittyTheftEnabled &&
                    !this.props.state.finalized &&
                    this.props.state.autobid === null), className: "big" }, "Start game"));
        var bidUI = kittyTheftEnabled &&
            this.props.state.finalized &&
            this.props.state.autobid === null &&
            (!isExchanger || lastBid.epoch + 1 !== this.props.state.epoch) ? (react.createElement(react.Fragment, null,
            react.createElement(src_BidArea, { bids: this.props.state.bids, autobid: this.props.state.autobid, hands: this.props.state.hands, epoch: this.props.state.epoch, name: this.props.name, landlord: this.props.state.propagated.landlord, players: this.props.state.propagated.players, bidPolicy: this.props.state.propagated.bid_policy, bidReinforcementPolicy: this.props.state.propagated.bid_reinforcement_policy, jokerBidPolicy: this.props.state.propagated.joker_bid_policy, numDecks: this.props.state.num_decks, header: react.createElement("h2", null,
                    "Bids (round ",
                    this.props.state.epoch + 1,
                    " of bidding)"), suffixButtons: react.createElement(react.Fragment, null,
                    react.createElement("button", { onClick: this.pickUpKitty, disabled: lastBid.id !== playerId ||
                            lastBid.epoch !== this.props.state.epoch, className: "big" }, "Pick up cards from the bottom"),
                    isLandlord ? startGame : null), bidTakeBacksEnabled: this.props.state.propagated.bid_takeback_policy ===
                    "AllowBidTakeback" }),
            this.props.compact ? null : (react.createElement(src_LabeledPlay, { className: "kitty", trump: this.props.state.trump, cards: this.props.state.kitty, label: "\u5E95\u724C" })))) : null;
        var friendUI = this.props.state.game_mode !== "Tractor" && isLandlord ? (react.createElement("div", null,
            react.createElement(src_Friends, { gameMode: this.props.state.game_mode, showPlayed: false }),
            this.state.friends.map(function (friend, idx) {
                var onChange = function (x) {
                    var newFriends = Exchange_spreadArray([], _this.state.friends, true);
                    newFriends[idx] = x;
                    _this.setState({ friends: newFriends });
                    _this.fixFriends();
                };
                return (react.createElement(src_FriendSelect, { onChange: onChange, key: idx, friend: friend, trump: _this.props.state.trump, friend_selection_policy: _this.props.state.propagated.friend_selection_policy, num_decks: _this.props.state.num_decks }));
            }),
            react.createElement("button", { onClick: this.pickFriends, className: "big" }, "Pick friends"))) : null;
        return (react.createElement("div", null,
            this.props.compact ? null : (react.createElement(react.Fragment, null,
                react.createElement(src_Header, { gameMode: this.props.state.game_mode, chatLink: this.props.state.propagated.chat_link }),
                react.createElement(src_Players, { players: this.props.state.propagated.players, observers: this.props.state.propagated.observers, landlord: this.props.state.landlord, next: nextPlayer, name: this.props.name }),
                react.createElement(Trump, { trump: this.props.state.trump }),
                (this.props.state.removed_cards || []).length > 0 ? (react.createElement("p", null,
                    "Note:",
                    " ",
                    (this.props.state.removed_cards || []).map(function (c) { return (react.createElement(src_InlineCard, { key: c, card: c })); }),
                    " ",
                    "have been removed from the deck")) : null)),
            friendUI,
            exchangeUI,
            exchangeUI === null && bidUI === null && playerId >= 0 ? (react.createElement(react.Fragment, null,
                react.createElement(src_Cards, { hands: this.props.state.hands, playerId: playerId, trump: this.props.state.trump }),
                react.createElement("p", null, "Waiting..."))) : null,
            playerId !== nextPlayer && react.createElement(src_BeepButton, null),
            isLandlord && bidUI === null ? startGame : null,
            bidUI));
    };
    return Exchange;
}(react.Component));
/* harmony default export */ const src_Exchange = (ExchangeWrapper);

;// ./src/Credits.tsx



var Credits_contentStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
};
var changeLogVersion = 25;
var ChangeLog = function () {
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    var _b = react.useContext(AppStateContext), state = _b.state, updateState = _b.updateState;
    react.useEffect(function () {
        if (state.changeLogLastViewed !== changeLogVersion) {
            setModalOpen(true);
        }
    }, []);
    return (react.createElement(react.Fragment, null,
        react.createElement("a", { onClick: function (evt) {
                evt.preventDefault();
                setModalOpen(true);
            }, href: window.location.href }, "Change Log"),
        react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () {
                setModalOpen(false);
                updateState({ changeLogLastViewed: changeLogVersion });
            }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: Credits_contentStyle } },
            react.createElement("h2", null, "For new players"),
            react.createElement("p", null,
                "If you haven't learned to play the game yet, consider reading the",
                " ",
                react.createElement("a", { href: "rules.html", target: "_blank" }, "rules"),
                "."),
            react.createElement("p", null, "There are a wide variety of game settings which may suit the way you normally play, e.g. changing how many decks, how scoring works, etc. These can be changed before every round."),
            react.createElement("p", null, "There are also a bunch of UI customizations that you may want to turn on (or leave off) -- click the gear icon at the top of the screen once you're in the game."),
            react.createElement("h2", null, "Change Log"),
            react.createElement("p", null, "9/18/2026 (this fork):"),
            react.createElement("ul", null,
                react.createElement("li", null, "Accounts: you sign in with Google, and your in-game name is always your account name. There are no passwords here at all. One account per person; no alts."),
                react.createElement("li", null,
                    "Matches: a room plays \u201Cfirst to rank N\u201D matches (5 by default, changeable in the game settings). The first round of a match only starts once ",
                    react.createElement("em", null, "every"),
                    " player has clicked start; the match ends the moment someone reaches the target rank, and everyone goes back to rank 2."),
                react.createElement("li", null, "Rated matches: rooms are rated by default, and a rated match moves an Elo-style rating once, when it ends, by an amount that depends on the ratings involved and the final margin (see RATINGS.md). Two ladders, team and 1v1, with a leaderboard on the landing page. Rounds are never rated on their own."),
                react.createElement("li", null, "Rounds now end by themselves as soon as the cards left can't change the result and the bottom holds no points, so the manual \u201Cend game early\u201D button is gone."),
                react.createElement("li", null, "Account pages: per-player ratings, statistics and match history. Click any player's name to open theirs."),
                react.createElement("li", null, "1v1 rooms: exactly two people, each playing both seats of a team, rated on their own ladder."),
                react.createElement("li", null, "New defaults: fast autodraw, no taking back bids or plays, and the bottom penalty is 2^n (n = the size of the largest component of the last trick). All are still room settings; only the defaults changed."),
                react.createElement("li", null, "Removed Sentry error reporting and the upstream social metadata.")),
            react.createElement("p", null, "3/18/2026:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added bomb card support for games with 4+ decks. A bomb is 4 or more identical cards played together, which beats any other play of the same size. Can be configured to require suit-following or allow any suit. Disabled by default; enable under \u201Cmore game settings\u201D.")),
            react.createElement("p", null, "7/10/2023:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added a confirmation check from another player when resetting the game")),
            react.createElement("p", null, "1/20/2024:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added the ability to protect both longer tuples and tractors at the same time.")),
            react.createElement("p", null, "2/24/2023:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added the ability to list a room publicly for others to join (thanks jimmyfang94!)")),
            react.createElement("p", null, "1/18/2023:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fixed performance issue when playing tricks with many cards"),
                react.createElement("li", null, "Added suggested play button")),
            react.createElement("p", null, "1/11/2023:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fixed rendering of card icons")),
            react.createElement("p", null, "1/10/2023:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Changed default UI setting to \u201Cshow cards in player order\u201D."),
                react.createElement("li", null, "Added icons (can be turned off) for point cards and trump cards.")),
            react.createElement("p", null, "12/28/2023:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix bug where over-trumping a trumped throw would sometimes not work.")),
            react.createElement("p", null, "9/25/2022:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add the ability to disable joker bids"),
                react.createElement("li", null, "Add the ability to set autodraw speed")),
            react.createElement("p", null, "4/17/2022:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add the ability to hide the chat box and move the points progress bar in the settings pane.")),
            react.createElement("p", null, "3/07/2022:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add the ability to choose the final level (NT or A) in difficulty settings.")),
            react.createElement("p", null, "2/05/2022:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added long-missing support for no-trump rank after A."),
                react.createElement("li", null, "Added setting to show player name in title bar."),
                react.createElement("li", null, "Added ability to set meta-rank (behind checkbox).")),
            react.createElement("p", null, "7/04/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added option to customize the minimum tractor size under \u201Cmore game settings\u201D")),
            react.createElement("p", null, "6/18/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added option for higher suit non-joker bids to outbid non-joker bids.")),
            react.createElement("p", null, "3/21/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added option to view (most of) the UI in dark mode."),
                react.createElement("li", null, "Added button to randomize the player order."),
                react.createElement("li", null, "Added button to check if everyone is ready.")),
            react.createElement("p", null, "3/15/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Added option in Finding Friends to select friends using trumps.")),
            react.createElement("p", null, "2/15/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support protecting tractors from four-of-a-kind.")),
            react.createElement("p", null, "2/4/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support configuring custom deck properties, like short decks or removing jokers.")),
            react.createElement("p", null, "2/2/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix bug where unselecting cards would temporarily remove them from the game.")),
            react.createElement("p", null, "1/31/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Players can now choose kitty sizes which require cards to be removed from the game.")),
            react.createElement("p", null, "1/27/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "When ending the game early, let players see what cards were remaining.")),
            react.createElement("p", null, "1/22/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add the ability to end the game early when there are insufficient points remaining to matter.")),
            react.createElement("p", null, "1/21/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add a scoring progress bar with point thresholds."),
                react.createElement("li", null, "Add a setting to prevent friends from joining twice (in difficulty settings).")),
            react.createElement("p", null, "1/18/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Amend the \u201CPointCardNotAllowed\u201D friend selection policy. King is now a valid friend when the landlord's rank is Ace.")),
            react.createElement("p", null, "1/8/2021:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add settings for reinforcing a bid after it has been overturned, and for overbidding yourself."),
                react.createElement("li", null, "Add a setting to show debug information, to help with more detailed bug reports.")),
            react.createElement("p", null, "12/11/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support a friend selection policy that disallows point cards.")),
            react.createElement("p", null, "12/07/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add a setting which hides the indication of which player that can defeat a throw."),
                react.createElement("li", null, "Add a card-protection setting which disables format-based play requirements.")),
            react.createElement("p", null, "11/22/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null,
                    "More rigorously define trick-format decomposition, especially when more than four decks are involved. See the issues referenced in",
                    " ",
                    react.createElement("a", { href: "https://github.com/rbtying/shengji/pull/258/files", target: "_blank", rel: "noreferrer" }, "PR #258"),
                    " ",
                    "for details.")),
            react.createElement("p", null, "11/13/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix bug in longest-component throw-evaluation policy where the winner for tricks of single cards was always the first player.")),
            react.createElement("p", null, "11/11/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support a throw evaluation policy based on the longest component.")),
            react.createElement("p", null, "11/01/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support more granular step sizes in scoring settings on a per-number-of-decks basis.")),
            react.createElement("p", null, "9/27/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support limiting joker/no-trump bids in games with more than two decks.")),
            react.createElement("p", null, "9/18/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix performance issues in long games.")),
            react.createElement("p", null, "8/30/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support end of game kitty reveal.")),
            react.createElement("p", null, "8/09/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support configuring different score thresholds for each game.")),
            react.createElement("p", null, "8/07/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Allow card colors to be customized"),
                react.createElement("li", null, "Add option to play sound during draw. Sound sourced from dersuperanton at freesound.org")),
            react.createElement("p", null, "8/02/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Support beeps in exchange phase")),
            react.createElement("p", null, "7/26/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix a bug where throws in trump of the trump-rank-card would be incorrectly blocked"),
                react.createElement("li", null, "Implement helper which lets you know what plays you can make and tells you about format-decompositions"),
                react.createElement("li", null, "Allow player to specify preferred grouping in case of ambiguity, e.g. 22333 as either [22][333] or [2233][3]"),
                react.createElement("li", null, "Add UI hint which shows you cards in the same suit"),
                react.createElement("li", null, "Add UI setting which allows you to separate cards by suit")),
            react.createElement("p", null, "7/23/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Move a bunch of settings into modals to make interface cleaner")),
            react.createElement("p", null, "7/19/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Bid by clicking on a predefined set of valid bids")),
            react.createElement("p", null, "7/18/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Allow zero-sized kitty in the UI")),
            react.createElement("p", null, "7/15/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add game option for limiting who can start a game")),
            react.createElement("p", null, "7/09/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add a game option for (disallowing) shadowing of other players")),
            react.createElement("p", null, "7/02/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#21) Add a screen and confetti when you successfully defend A!")),
            react.createElement("p", null, "7/02/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#171) Add game option disable taking back bids"),
                react.createElement("li", null, "(#68) Add game option disable taking back plays"),
                react.createElement("li", null, "(#17) Add game option for \u201Cstealing\u201D the bottom cards")),
            react.createElement("p", null, "7/01/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add the option to use SVG cards rather than text cards.")),
            react.createElement("p", null, "6/28/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#163) add game option to reward a bonus level for landlord team to win with a smaller size team")),
            react.createElement("p", null, "6/26/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#160) add game option to allow outbid only with more cards")),
            react.createElement("p", null, "6/25/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#158) add user option to display bid cards in separate row in Draw stage")),
            react.createElement("p", null, "6/24/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#156) add FirstLandlordSelectionPolicy to set the first bidder as landlord when no landlord is selected")),
            react.createElement("p", null, "6/21/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#145) Save, load, reset game settings"),
                react.createElement("li", null, "(#154) Landlord emoji option")),
            react.createElement("p", null, "6/20/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add the ability to wrap-around after defending on A."),
                react.createElement("li", null, "Show throw breakdowns in the UI to make throws more obvious.")),
            react.createElement("p", null, "6/17/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix bug where points display was highlighted blue.")),
            react.createElement("p", null, "6/14/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix bug where previous-trick showed current trick."),
                react.createElement("li", null, "(#134) Fix bug where defend-points allowed defending team to skip defending points.")),
            react.createElement("p", null, "6/13/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#133) Improve trick list to show landlord, better coloring of team and winning trick.")),
            react.createElement("p", null, "6/12/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#131) Add option to disallow using highest non-trump card to select friend.")),
            react.createElement("p", null, "6/7/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#127) Simplify friend selection description.")),
            react.createElement("p", null, "6/6/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "(#125) Highlight all members of the landlord's team in the trick view.")),
            react.createElement("p", null, "6/5/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix a bug (#35) so as to disallow picking trump cards as friend.")),
            react.createElement("p", null, "5/25/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Fix bug in longest-tuple-protected mode where tractors of longer tuples would erroneously get drawn out."),
                react.createElement("li", null, "Add support for throw evaluation based on the highest card in the throw.")),
            react.createElement("p", null, "5/24/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add game result statistics tracking.")),
            react.createElement("p", null, "5/13/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "Add an option to protect triples from being drawn out by pairs"),
                react.createElement("li", null, "Fill in the suit character in the trump UI")),
            react.createElement("p", null, "5/8/2020:"),
            react.createElement("ul", null,
                react.createElement("li", null, "When leader is set to winner-of-bid, players bid their own levels rather than a random selected one."),
                react.createElement("li", null, "Card labels are not visible above the settings pane."),
                react.createElement("li", null, "Cards can be revealed from the bottom when the deck is fully drawn to determine trump.")),
            react.createElement("hr", null),
            react.createElement("p", null, "Changes prior to 5/8/2020 not listed"))));
};
var Credits = function () { return (react.createElement("div", { className: "credits" },
    react.createElement("p", null,
        "This is a vibecoded clone of",
        " ",
        react.createElement("a", { href: "https://robertying.com/shengji/", target: "_blank", rel: "noreferrer" }, "Robert Ying's shengji"),
        " ",
        ". All of the real work is Robert Ying (",
        react.createElement("a", { href: "mailto:me@robertying.com" }, "me@robertying.com"),
        "), Abra Shen and other",
        " ",
        react.createElement("a", { href: "https://github.com/rbtying/shengji/graphs/contributors", target: "_blank", rel: "noreferrer" }, "friends"),
        "; the original is on",
        " ",
        react.createElement("a", { href: "https://github.com/rbtying/shengji", target: "_blank", rel: "noreferrer" }, "GitHub"),
        "."),
    react.createElement("p", { className: "donate" },
        react.createElement("strong", null, "If you enjoy this, please donate to Robert Ying: Venmo @Robert-Ying"),
        ", or via",
        " ",
        react.createElement("a", { href: "https://donate.stripe.com/aEU8x982f3oj4Ja7ss", target: "_blank", rel: "noreferrer" },
            react.createElement("strong", null, "other payment methods")),
        ".",
        react.createElement("span", { style: { float: "right" } },
            react.createElement(ChangeLog, null))))); };
/* harmony default export */ const src_Credits = (Credits);

;// ./src/icons/PaperPlane.tsx

var PaperPlane = function (_a) {
    var _b = _a.width, width = _b === void 0 ? "100%" : _b;
    return (react.createElement("svg", { focusable: "false", role: "img", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512", width: width },
        react.createElement("path", { fill: "currentcolor", d: "M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z" })));
};
/* harmony default export */ const icons_PaperPlane = (PaperPlane);

;// ./src/ChatInput.tsx
var ChatInput_makeTemplateObject = (undefined && undefined.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};




var ChatBox = styled_components_browser_esm/* default */.Ay.div(ChatInput_templateObject_1 || (ChatInput_templateObject_1 = ChatInput_makeTemplateObject(["\n  border-radius: 25px;\n  border: 0px;\n  outline: none;\n  background-color: #eee;\n  display: flex;\n  flex-direction: row;\n  padding-left: 1em;\n  padding-right: 1em;\n  margin: 0.5em;\n"], ["\n  border-radius: 25px;\n  border: 0px;\n  outline: none;\n  background-color: #eee;\n  display: flex;\n  flex-direction: row;\n  padding-left: 1em;\n  padding-right: 1em;\n  margin: 0.5em;\n"])));
var Input = styled_components_browser_esm/* default */.Ay.input(ChatInput_templateObject_2 || (ChatInput_templateObject_2 = ChatInput_makeTemplateObject(["\n  outline: none;\n  background-color: #eee;\n  border: none;\n  margin-top: 0.6em;\n  margin-bottom: 0.6em;\n  font-size: 14px;\n  line-height: 14px;\n  height: 14px;\n  flex: 1;\n"], ["\n  outline: none;\n  background-color: #eee;\n  border: none;\n  margin-top: 0.6em;\n  margin-bottom: 0.6em;\n  font-size: 14px;\n  line-height: 14px;\n  height: 14px;\n  flex: 1;\n"])));
var ChatInput = function (props) {
    var _a = react.useState(""), draft = _a[0], setDraft = _a[1];
    var handleSubmit = function (event) {
        event.preventDefault();
        if (draft.length > 0) {
            props.onSubmit(draft);
            setDraft("");
        }
    };
    var disabled = draft === "";
    return (react.createElement("form", { onSubmit: handleSubmit, autoComplete: "off" },
        react.createElement(ChatBox, null,
            react.createElement(Input, { type: "text", placeholder: "type message here", value: draft, onChange: function (e) { return setDraft(e.target.value); } }),
            react.createElement(src_IconButton, { type: "submit", style: {
                    opacity: disabled ? 0 : 1,
                    transform: disabled ? "translate(1em, 0)" : "none",
                    margin: "auto",
                }, disabled: disabled },
                react.createElement(icons_PaperPlane, { width: "16px" })))));
};
/* harmony default export */ const src_ChatInput = (ChatInput);
var ChatInput_templateObject_1, ChatInput_templateObject_2;

;// ./src/ChatMessage.tsx





var ChatMessage_ladderName = function (mode) {
    return mode === "1v1" ? "1v1 ladder" : "team ladder";
};
var renderMessage = function (message) {
    var _a, _b, _c, _d, _e;
    var variant = (_a = message.data) === null || _a === void 0 ? void 0 : _a.variant;
    switch (variant === null || variant === void 0 ? void 0 : variant.type) {
        case "StartVote":
            return (react.createElement("span", null, (_b = message.data) === null || _b === void 0 ? void 0 :
                _b.actor_name,
                " is ready to start (",
                variant.votes,
                "/",
                variant.needed,
                ")"));
        case "MatchStarted":
            return react.createElement("span", null,
                "Match started: first to rank ",
                variant.first_to_rank);
        case "FirstToRankSet":
            return (react.createElement("span", null, (_c = message.data) === null || _c === void 0 ? void 0 :
                _c.actor_name,
                " set the match to first to rank",
                " ",
                variant.rank));
        case "MatchAbandoned":
            return (react.createElement("span", null, "The match was abandoned because a player left; everyone is back at rank 2"));
        case "GameEndedAutomatically":
            return (react.createElement("span", null, "The remaining cards can't change the result, so this round is over"));
        case "MadeBid":
            return (react.createElement("span", null, (_d = message.data) === null || _d === void 0 ? void 0 :
                _d.actor_name,
                " bid",
                " ",
                array.range(variant.count, function (i) { return (react.createElement(src_InlineCard, { card: variant.card, key: i })); })));
        case "PlayedCards":
            return (react.createElement("span", null, (_e = message.data) === null || _e === void 0 ? void 0 :
                _e.actor_name,
                " played",
                " ",
                variant.cards.map(function (card, i) { return (react.createElement(src_InlineCard, { card: card, key: i })); })));
        case "EndOfGameKittyReveal":
            return (react.createElement("span", null,
                variant.cards.map(function (card, i) { return (react.createElement(src_InlineCard, { card: card, key: i })); }),
                " ",
                "in kitty"));
        case "GameScoringParametersChanged":
            return renderScoringMessage(message);
        default:
            return react.createElement("span", null, message.message);
    }
};
var renderScoringMessage = function (message) {
    var _a, _b;
    var changes = [];
    var variant = (_a = message.data) === null || _a === void 0 ? void 0 : _a.variant;
    if ((variant === null || variant === void 0 ? void 0 : variant.type) === "GameScoringParametersChanged") {
        if (variant.old_parameters.step_size_per_deck !==
            variant.parameters.step_size_per_deck) {
            changes.push(react.createElement("span", { key: changes.length },
                "step size: ",
                variant.parameters.step_size_per_deck,
                "\u5206 per deck"));
        }
        if (variant.old_parameters.deadzone_size !== variant.parameters.deadzone_size) {
            changes.push(react.createElement("span", { key: changes.length },
                "non-leveling steps: ",
                variant.parameters.deadzone_size,
                " "));
        }
        if (variant.old_parameters.num_steps_to_non_landlord_turnover !==
            variant.parameters.num_steps_to_non_landlord_turnover) {
            changes.push(react.createElement("span", { key: changes.length },
                "steps to turnover:",
                " ",
                variant.parameters.num_steps_to_non_landlord_turnover,
                " "));
        }
        for (var k in variant.parameters.step_adjustments) {
            var adj = variant.parameters.step_adjustments[k];
            if (adj !== variant.old_parameters.step_adjustments[k]) {
                changes.push(react.createElement("span", { key: changes.length },
                    "step size adjustment for ",
                    k,
                    " decks set to ",
                    adj,
                    " "));
            }
        }
        for (var k in variant.old_parameters.step_adjustments) {
            var adj = variant.parameters.step_adjustments[k];
            if (adj === undefined || adj === null || adj === 0) {
                changes.push(react.createElement("span", { key: changes.length },
                    "adjustment for ",
                    k,
                    " decks removed "));
            }
        }
        if (variant.old_parameters.bonus_level_policy !==
            variant.parameters.bonus_level_policy) {
            if (variant.parameters.bonus_level_policy ===
                "BonusLevelForSmallerLandlordTeam") {
                changes.push(react.createElement("span", { key: changes.length }, "small-team bonus enabled"));
            }
            else {
                changes.push(react.createElement("span", { key: changes.length }, "small-team bonus disabled"));
            }
        }
        return (react.createElement("span", null, (_b = message.data) === null || _b === void 0 ? void 0 :
            _b.actor_name,
            " updated the scoring parameters: ",
            changes));
    }
    else {
        return react.createElement(react.Fragment, null);
    }
};
/// A `MatchRated` message: one line per user, "alice 1500 → 1680 (+180)".
/// Ratings only move at the end of a rated match.
var renderMatchRated = function (message, ratings) { return (react.createElement("div", { className: classnames_default()("message", "ratings-update", {
        "game-message": message.from_game,
    }) },
    react.createElement("span", null,
        message.from,
        ": "),
    react.createElement("span", null,
        "Match rated (",
        ChatMessage_ladderName(ratings.mode),
        ")"),
    react.createElement("ul", null, ratings.changes.map(function (c) { return (react.createElement("li", { key: c.username },
        react.createElement("span", { className: "ratings-update-user" }, c.username),
        " ",
        c.before,
        " \u2192",
        " ",
        c.after,
        " ",
        react.createElement("span", { className: classnames_default()("ratings-update-delta", {
                up: c.delta > 0,
                down: c.delta < 0,
            }) },
            "(",
            (0,api/* formatDelta */.CW)(c.delta),
            ")"))); })))); };
/// A `MatchFinished` broadcast: the final standings, winners marked. (It
/// gets a block of its own rather than going through `renderMessage`, which
/// renders into a `<p>`.)
var renderMatchFinished = function (message, variant) { return (react.createElement("div", { className: classnames_default()("message", "match-finished", {
        "game-message": message.from_game,
    }) },
    react.createElement("span", null,
        message.from,
        ": "),
    react.createElement("span", null,
        "Match over \u2014 first to rank ",
        variant.first_to_rank),
    react.createElement("ul", null, variant.standings.map(function (s) { return (react.createElement("li", { key: s.player, className: classnames_default()({ winner: s.winner }) },
        s.winner ? "🏆 " : "",
        s.name,
        " \u2014 rank ",
        s.rank,
        " (",
        s.levels,
        " ",
        s.levels === 1 ? "level" : "levels",
        ")")); })))); };
var ChatMessage = function (props) {
    var _a, _b;
    var message = props.message;
    if (message.ratings !== undefined && message.ratings !== null) {
        return renderMatchRated(message, message.ratings);
    }
    var variant = (_a = message.data) === null || _a === void 0 ? void 0 : _a.variant;
    if ((variant === null || variant === void 0 ? void 0 : variant.type) === "MatchFinished") {
        return renderMatchFinished(message, variant);
    }
    return (react.createElement(react.Fragment, null,
        ((_b = message.data) === null || _b === void 0 ? void 0 : _b.variant.type) === "StartingGame" ? (react.createElement("p", { className: classnames_default()("message", {
                "game-message": message.from_game,
            }) }, "\uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C \uD83D\uDE9C")) : null,
        react.createElement("p", { className: classnames_default()("message", { "game-message": message.from_game }) },
            "from" in message && react.createElement("span", null,
                message.from,
                ": "),
            renderMessage(message))));
};
/* harmony default export */ const src_ChatMessage = (ChatMessage);

;// ./src/Chat.tsx





var Chat = function (props) {
    var anchor = react.useRef(null);
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var settings = react.useContext(SettingsContext);
    react.useEffect(function () {
        var _a;
        if (anchor.current !== null) {
            var rect = anchor.current.getBoundingClientRect();
            var html = document.documentElement;
            var isVisible = rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || html.clientHeight) &&
                rect.right <= (window.innerWidth || html.clientWidth);
            if (isVisible) {
                (_a = anchor.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ block: "nearest", inline: "start" });
            }
        }
    }, [props.messages]);
    var handleSubmit = function (message) { return send({ Message: message }); };
    return (react.createElement(react.Fragment, null, !settings.hideChatBox && (react.createElement("div", { className: "chat" },
        react.createElement("div", { className: "messages" },
            props.messages.map(function (m, idx) { return (react.createElement(src_ChatMessage, { message: m, key: idx })); }),
            react.createElement("div", { className: "chat-anchor", ref: anchor })),
        react.createElement(src_ChatInput, { onSubmit: handleSubmit })))));
};
/* harmony default export */ const src_Chat = (Chat);

;// ./src/Beeper.tsx



var defaultBeeper = function () { return src_beep(3, 440, 200); };
var Beeper = function (_a) {
    var _b = _a.beeper, beeper = _b === void 0 ? defaultBeeper : _b, _c = _a.interval, interval = _c === void 0 ? 5000 : _c;
    var _d = react.useContext(TimerProvider/* TimerContext */.P), setInterval = _d.setInterval, clearInterval = _d.clearInterval;
    react.useEffect(function () {
        beeper();
        var timer = setInterval(beeper, interval);
        return function () { return clearInterval(timer); };
    }, []);
    return null;
};
/* harmony default export */ const src_Beeper = (Beeper);

;// ./src/Trick.tsx





var TrickE = function (props) {
    var _a;
    var namesById = array.mapObject(props.players, function (p) { return [
        String(p.id),
        p.name,
    ]; });
    var blankCards = props.trick.played_cards.length > 0
        ? Array(props.trick.played_cards[0].cards.length).fill("🂠")
        : ["🂠"];
    var betterPlayer = props.trick.played_cards.length > 0
        ? props.trick.played_cards[0].better_player
        : null;
    var playedByID = {};
    var cardsFromMappingByID = {};
    var playOrder = [];
    props.trick.played_cards.forEach(function (played, idx) {
        playOrder.push(played.id);
        playedByID[played.id] = played;
        var m = props.trick.played_card_mappings
            ? props.trick.played_card_mappings[idx]
            : undefined;
        if (m !== undefined && m !== null && m.length > 0) {
            // We should coalesce blocks of `Repeated` of count 1 together, since
            // that displays more nicely.
            var mapping_1 = [];
            var singles_1 = [];
            m.forEach(function (mm) {
                if ("Repeated" in mm && mm.Repeated.count === 1) {
                    singles_1.push(mm.Repeated.card.card);
                }
                else if ("Repeated" in mm) {
                    mapping_1.push(array.range(mm.Repeated.count, function (_) { return mm.Repeated.card.card; }));
                }
                else if ("Tractor" in mm) {
                    mapping_1.push(mm.Tractor.members.flatMap(function (mmm) {
                        return array.range(mm.Tractor.count, function (_) { return mmm.card; });
                    }));
                }
            });
            mapping_1.push(singles_1);
            cardsFromMappingByID[played.id] = mapping_1;
        }
    });
    if (props.showTrickInPlayerOrder) {
        playOrder = props.players.map(function (p) { return p.id; });
    }
    else {
        props.trick.player_queue.forEach(function (id) { return playOrder.push(id); });
    }
    var isRainbow = ((_a = props.trick.trick_format) === null || _a === void 0 ? void 0 : _a.is_rainbow) === true;
    return (react.createElement("div", { className: "trick" },
        isRainbow && (react.createElement("div", { style: { fontWeight: "bold", marginBottom: "4px" } }, "\uD83C\uDF08 Rainbow trick \u2014 play same rank across \u22654 suits to counter")),
        playOrder.map(function (id) {
            var _a, _b;
            var winning = props.trick.current_winner === id;
            var better = betterPlayer === id;
            var cards = id in playedByID ? playedByID[id].cards : blankCards;
            var suffix = winning ? (react.createElement(react.Fragment, null,
                " ",
                react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "winningTip", place: "bottom" }),
                react.createElement("span", { "data-tooltip-id": "winningTip", "data-tooltip-content": "Current winner of trick" },
                    "(",
                    react.createElement("code", null, "!"),
                    ")"))) : better ? (react.createElement(react.Fragment, null,
                " ",
                react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "betterTip", place: "bottom" }),
                react.createElement("span", { "data-tooltip-id": "betterTip", "data-tooltip-content": "First player who can prevent the attempted throw" },
                    "(",
                    react.createElement("code", null, "-"),
                    ")"))) : (react.createElement(react.Fragment, null));
            var className = classnames_default()(winning
                ? "winning"
                : props.trick.player_queue[0] === id
                    ? "notify"
                    : "", {
                landlord: id === props.landlord || ((_a = props.landlords_team) === null || _a === void 0 ? void 0 : _a.includes(id)),
            });
            return (react.createElement(src_LabeledPlay, { key: id, id: id, label: react.createElement(react.Fragment, null,
                    namesById[id] +
                        (id === props.landlord ? " " + props.landlord_suffix : ""),
                    suffix), className: className, groupedCards: cardsFromMappingByID[id], cards: cards, trump: props.trick.trump, next: props.next, moreCards: (_b = playedByID[id]) === null || _b === void 0 ? void 0 : _b.bad_throw_cards }));
        })));
};
/* harmony default export */ const Trick = (TrickE);

;// ./src/ProgressBar.tsx

var CheckpointCircle = function (props) {
    return (react.createElement("div", { style: {
            position: "relative",
            left: props.position,
            transform: "translate(-50%, 0%)",
            backgroundColor: props.color,
            marginTop: props.marginTop,
            height: "30px",
            width: "30px",
            borderWidth: "5px",
            borderStyle: "solid",
            borderColor: props.borderColor !== undefined ? props.borderColor : props.color,
            borderRadius: "25px",
        } },
        react.createElement("div", { style: {
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            } }, props.text)));
};
var convertToPercentage = function (proportion) {
    proportion = Math.max(0, Math.min(1, proportion));
    return (100 * proportion).toFixed(2) + "%";
};
var ProgressBar = function (props) {
    var landlordColor = "#d9534f";
    var challengerColor = "#5bc0de";
    var neutralColor = "lightgray";
    var totalPoints = props.totalPoints, challengerPoints = props.challengerPoints, landlordPoints = props.landlordPoints;
    var checkpointColors = props.checkpoints.map(function (checkpoint) {
        if (challengerPoints >= checkpoint) {
            return challengerColor;
        }
        else if (landlordPoints >= totalPoints - checkpoint) {
            return landlordColor;
        }
        else {
            return neutralColor;
        }
    });
    var landlordPosition = convertToPercentage((totalPoints - landlordPoints) / totalPoints);
    var landlordWidth = convertToPercentage(landlordPoints / totalPoints);
    var challengerPosition = convertToPercentage(challengerPoints / totalPoints);
    return (react.createElement("div", { style: { color: "#000", padding: "0px 5px" } },
        react.createElement("div", { style: {
                width: "100%",
                borderRadius: "5px",
                backgroundColor: "lightgray",
            } },
            react.createElement("div", { style: {
                    width: challengerPosition,
                    height: "20px",
                    borderRadius: "5px",
                    backgroundColor: challengerColor,
                } }),
            !props.hideLandlordPoints && (react.createElement("div", { className: "progress-bar-landlord", style: {
                    marginTop: "-20px",
                    position: "relative",
                    left: landlordPosition,
                    width: landlordWidth,
                    height: "20px",
                    borderRadius: "5px",
                    backgroundColor: landlordColor,
                } }))),
        props.checkpoints.map(function (checkpoint, i) {
            return (react.createElement(CheckpointCircle, { key: i, text: checkpoint, color: checkpointColors[i], position: convertToPercentage(checkpoint / totalPoints), marginTop: i === 0 ? "-30px" : "-40px" }));
        }),
        react.createElement(CheckpointCircle, { text: challengerPoints, color: "#fff", borderColor: challengerColor, position: challengerPosition, marginTop: "-40px" }),
        !props.hideLandlordPoints && (react.createElement(CheckpointCircle, { text: totalPoints - landlordPoints, color: "#fff", borderColor: landlordColor, position: landlordPosition, marginTop: "-40px" }))));
};
/* harmony default export */ const src_ProgressBar = (ProgressBar);

;// ./src/Points.tsx
var Points_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Points_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};










var calculatePoints = function (players, landlordTeam, points, penalties) {
    var pointsPerPlayer = util_object.mapValues(points, function (cards) {
        return array.sum(cards.map(function (card) { return cardLookup[card].points; }));
    });
    var totalPointsPlayed = array.sum(Object.values(pointsPerPlayer));
    var nonLandlordPoints = array.sum(players
        .filter(function (p) { return !landlordTeam.includes(p.id); })
        .map(function (p) { return pointsPerPlayer[p.id]; }));
    var nonLandlordPointsWithPenalties = nonLandlordPoints;
    players.forEach(function (p) {
        var penalty = penalties[p.id];
        if (penalty > 0) {
            if (landlordTeam.includes(p.id)) {
                nonLandlordPointsWithPenalties += penalty;
            }
            else {
                nonLandlordPointsWithPenalties -= penalty;
            }
        }
    });
    return {
        nonLandlordPoints: nonLandlordPoints,
        nonLandlordPointsWithPenalties: nonLandlordPointsWithPenalties,
        totalPointsPlayed: totalPointsPlayed,
    };
};
var Points = function (props) {
    var pointsPerPlayer = util_object.mapValues(props.points, function (cards) {
        return array.sum(cards.map(function (card) { return cardLookup[card].points; }));
    });
    var settings = react.useContext(SettingsContext);
    var engine = useEngine();
    var _a = react.useState(null), scoreData = _a[0], setScoreData = _a[1];
    var _b = react.useState([]), scoreTransitions = _b[0], setScoreTransitions = _b[1];
    var _c = react.useState(100), totalPoints = _c[0], setTotalPoints = _c[1];
    var _d = react.useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = calculatePoints(props.players, props.landlordTeam, props.points, props.penalties), totalPointsPlayed = _e.totalPointsPlayed, nonLandlordPointsWithPenalties = _e.nonLandlordPointsWithPenalties, nonLandlordPoints = _e.nonLandlordPoints;
    var penaltyDelta = nonLandlordPointsWithPenalties - nonLandlordPoints;
    react.useEffect(function () {
        setIsLoading(true);
        // Load both computeScore and explainScoring in parallel
        var loadData = function () { return Points_awaiter(void 0, void 0, void 0, function () {
            var scoringKey, scoringResult, promises, results, scoreResult, error_1;
            return Points_generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        scoringKey = (0,cachePrefill/* getExplainScoringKey */.O3)(props.gameScoringParameters, props.smallerTeamSize, props.decks);
                        scoringResult = cachePrefill/* explainScoringCache */.L9[scoringKey];
                        promises = [
                            engine.computeScore({
                                params: props.gameScoringParameters,
                                decks: props.decks,
                                smaller_landlord_team_size: props.smallerTeamSize,
                                non_landlord_points: nonLandlordPointsWithPenalties,
                            }),
                        ];
                        if (!scoringResult) {
                            promises.push(engine.explainScoring({
                                params: props.gameScoringParameters,
                                smaller_landlord_team_size: props.smallerTeamSize,
                                decks: props.decks,
                            }));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        scoreResult = results[0];
                        if (!scoringResult && results.length > 1) {
                            scoringResult = results[1];
                            cachePrefill/* explainScoringCache */.L9[scoringKey] = scoringResult;
                        }
                        setScoreData(scoreResult);
                        setScoreTransitions(scoringResult.results);
                        setTotalPoints(scoringResult.total_points);
                        setIsLoading(false);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error computing score:", error_1);
                        // Fallback to defaults
                        setScoreData({
                            score: {
                                landlord_won: false,
                                landlord_bonus: false,
                                landlord_delta: 0,
                                non_landlord_delta: 0,
                            },
                            next_threshold: 0,
                        });
                        setScoreTransitions([]);
                        setTotalPoints(100);
                        setIsLoading(false);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        loadData();
    }, [
        props.gameScoringParameters,
        props.decks,
        props.smallerTeamSize,
        nonLandlordPointsWithPenalties,
        engine,
    ]);
    if (isLoading || !scoreData) {
        return react.createElement("div", null, "Loading scores...");
    }
    var score = scoreData.score, nextThreshold = scoreData.next_threshold;
    var playerPointElements = props.players.map(function (player) {
        var onLandlordTeam = props.landlordTeam.includes(player.id);
        var cards = props.points[player.id].length > 0 ? props.points[player.id] : ["🂠"];
        var penalty = player.id in props.penalties ? props.penalties[player.id] : 0;
        if (props.hideLandlordPoints && onLandlordTeam) {
            return null;
        }
        else {
            return (react.createElement(src_LabeledPlay, { key: player.id, trump: props.trump, className: classnames_default()({ landlord: onLandlordTeam }), label: "".concat(player.name, ": ").concat(pointsPerPlayer[player.id] - penalty, "\u5206"), cards: cards }));
        }
    });
    // TODO: Pass the landlord as a Player object instead of numeric ID
    var landlord = props.players.find(function (p) { return p.id === props.landlord; });
    var thresholdStr = "";
    if (score.landlord_won) {
        thresholdStr = "".concat(landlord === null || landlord === void 0 ? void 0 : landlord.name, "'s team will go up ").concat(score.landlord_delta, " level").concat(score.landlord_delta === 1 ? "" : "s");
        if (score.landlord_bonus) {
            thresholdStr += ", including a small-team bonus";
        }
    }
    else if (score.non_landlord_delta === 0) {
        thresholdStr = "Neither team will go up a level";
    }
    else {
        thresholdStr = "The attacking team will go up ".concat(score.non_landlord_delta, " level").concat(score.non_landlord_delta === 1 ? "" : "s");
    }
    thresholdStr += " (next threshold: ".concat(nextThreshold, "\u5206)");
    return (react.createElement("div", { className: "points" },
        react.createElement("h2", null, "Points"),
        !settings.showPointsAboveGame && (react.createElement(src_ProgressBar, { checkpoints: scoreTransitions
                .map(function (transition) { return transition.point_threshold; })
                .filter(function (threshold) { return threshold >= 10 && threshold < totalPoints; }), totalPoints: totalPoints, landlordPoints: totalPointsPlayed - nonLandlordPoints, challengerPoints: nonLandlordPointsWithPenalties, hideLandlordPoints: props.hideLandlordPoints })),
        react.createElement("p", null,
            penaltyDelta === 0
                ? nonLandlordPoints
                : "".concat(nonLandlordPoints, " + ").concat(penaltyDelta),
            "\u5206",
            props.hideLandlordPoints ? null : " / ".concat(totalPointsPlayed, "\u5206"),
            " stolen from ", landlord === null || landlord === void 0 ? void 0 :
            landlord.name,
            "'s team. ",
            thresholdStr),
        playerPointElements));
};
var ProgressBarDisplay = function (props) {
    var engine = useEngine();
    var _a = react.useState([]), scoreTransitions = _a[0], setScoreTransitions = _a[1];
    var _b = react.useState(0), totalPoints = _b[0], setTotalPoints = _b[1];
    var _c = react.useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = calculatePoints(props.players, props.landlordTeam, props.points, props.penalties), totalPointsPlayed = _d.totalPointsPlayed, nonLandlordPointsWithPenalties = _d.nonLandlordPointsWithPenalties, nonLandlordPoints = _d.nonLandlordPoints;
    react.useEffect(function () {
        setIsLoading(true);
        var loadScoring = function () { return Points_awaiter(void 0, void 0, void 0, function () {
            var scoringKey, result, error_2;
            return Points_generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        scoringKey = (0,cachePrefill/* getExplainScoringKey */.O3)(props.gameScoringParameters, props.smallerTeamSize, props.decks);
                        result = cachePrefill/* explainScoringCache */.L9[scoringKey];
                        if (!!result) return [3 /*break*/, 2];
                        return [4 /*yield*/, engine.explainScoring({
                                params: props.gameScoringParameters,
                                smaller_landlord_team_size: props.smallerTeamSize,
                                decks: props.decks,
                            })];
                    case 1:
                        result = _a.sent();
                        cachePrefill/* explainScoringCache */.L9[scoringKey] = result;
                        _a.label = 2;
                    case 2:
                        setScoreTransitions(result.results);
                        setTotalPoints(result.total_points);
                        setIsLoading(false);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Error explaining scoring:", error_2);
                        setScoreTransitions([]);
                        setTotalPoints(100); // Default total
                        setIsLoading(false);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        loadScoring();
    }, [props.gameScoringParameters, props.smallerTeamSize, props.decks, engine]);
    if (isLoading) {
        return react.createElement("div", null, "Loading progress bar...");
    }
    return (react.createElement(src_ProgressBar, { checkpoints: scoreTransitions
            .map(function (transition) { return transition.point_threshold; })
            .filter(function (threshold) { return threshold >= 10 && threshold < totalPoints; }), totalPoints: totalPoints, landlordPoints: totalPointsPlayed - nonLandlordPoints, challengerPoints: nonLandlordPointsWithPenalties, hideLandlordPoints: props.hideLandlordPoints }));
};
/* harmony default export */ const src_Points = (Points);

;// ./src/AutoPlayButton.tsx

var AutoPlayButton = function (props) {
    var onSubmit = props.onSubmit, canSubmit = props.canSubmit, isCurrentPlayerTurn = props.isCurrentPlayerTurn, playDescription = props.playDescription, currentWinner = props.currentWinner, unsetAutoPlayWhenWinnerChanges = props.unsetAutoPlayWhenWinnerChanges;
    var _a = react.useState(null), autoplay = _a[0], setAutoplay = _a[1];
    react.useEffect(function () {
        if (autoplay !== null) {
            if (!canSubmit) {
                setAutoplay(null);
            }
            else if (unsetAutoPlayWhenWinnerChanges &&
                autoplay.observedWinner !== currentWinner) {
                setAutoplay(null);
            }
            else if (isCurrentPlayerTurn) {
                setAutoplay(null);
                onSubmit();
            }
        }
    }, [
        autoplay,
        canSubmit,
        currentWinner,
        isCurrentPlayerTurn,
        unsetAutoPlayWhenWinnerChanges,
    ]);
    var handleClick = function () {
        if (isCurrentPlayerTurn) {
            onSubmit();
        }
        else if (autoplay !== null) {
            setAutoplay(null);
        }
        else {
            setAutoplay({ observedWinner: currentWinner });
        }
    };
    return (react.createElement("button", { className: "big", onClick: handleClick, disabled: !canSubmit }, isCurrentPlayerTurn
        ? "Play selected cards".concat(playDescription !== null ? " (" + playDescription + ")" : "")
        : autoplay !== null
            ? "Don't autoplay selected cards"
            : "Autoplay selected cards"));
};
/* harmony default export */ const src_AutoPlayButton = (AutoPlayButton);

;// ./src/Play.tsx
var Play_assign = (undefined && undefined.__assign) || function () {
    Play_assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return Play_assign.apply(this, arguments);
};
var Play_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Play_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




















var Play_contentStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
};
var Play = function (props) {
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var settings = react.useContext(SettingsContext);
    var _a = react.useState([]), selected = _a[0], setSelected = _a[1];
    var _b = react.useState([]), grouping = _b[0], setGrouping = _b[1];
    var engine = useEngine();
    var _c = react.useState(null), lastPrefillTrump = _c[0], setLastPrefillTrump = _c[1];
    // Helper function to update selection and grouping
    var updateSelectionAndGrouping = function (newSelected, trump, tractorRequirements) { return Play_awaiter(void 0, void 0, void 0, function () {
        var plays, error_1;
        return Play_generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSelected(newSelected);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, engine.findViablePlays(trump, tractorRequirements, newSelected)];
                case 2:
                    plays = _a.sent();
                    setGrouping(plays);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error finding viable plays:", error_1);
                    setGrouping([]);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var playCards = function () {
        send({ Action: { PlayCardsWithHint: [selected, grouping[0].grouping] } });
        setSelected([]);
        setGrouping([]);
    };
    var sendEvent = function (event) { return function () { return send(event); }; };
    var takeBackCards = sendEvent({ Action: "TakeBackCards" });
    var endTrick = sendEvent({ Action: "EndTrick" });
    var startNewGame = sendEvent({ Action: "StartNewGame" });
    var playPhase = props.playPhase;
    // TODO: instead of telling who the player is by checking the name, pass in
    // the Player object
    var isSpectator = true;
    var currentPlayer = playPhase.propagated.players.find(function (p) { return p.name === props.name; });
    if (currentPlayer === undefined) {
        currentPlayer = playPhase.propagated.observers.find(function (p) { return p.name === props.name; });
    }
    else {
        isSpectator = false;
    }
    if (currentPlayer === undefined) {
        currentPlayer = {
            id: -1,
            name: props.name,
            level: "",
            metalevel: 0,
        };
    }
    // Prefill caches when trump or game parameters change
    react.useEffect(function () {
        var trumpKey = JSON.stringify(playPhase.trump);
        // Only prefill if trump has changed
        if (trumpKey !== lastPrefillTrump) {
            // Trump changed, prefill caches
            setLastPrefillTrump(trumpKey);
            // Prefill card info cache for all cards with the new trump
            (0,cachePrefill/* prefillCardInfoCache */.j9)(engine, playPhase.trump).catch(function (error) {
                console.error("Failed to prefill card info cache:", error);
            });
            // Prefill explainScoring cache
            if (playPhase.propagated.game_scoring_parameters && playPhase.decks) {
                (0,cachePrefill/* prefillExplainScoringCache */.bM)(engine, playPhase.propagated.game_scoring_parameters, playPhase.decks).catch(function (error) {
                    console.error("Failed to prefill explainScoring cache:", error);
                });
            }
        }
    }, [
        playPhase.trump,
        playPhase.propagated.game_scoring_parameters,
        playPhase.decks,
        engine,
        lastPrefillTrump,
    ]);
    react.useEffect(function () {
        // When the hands change, our `selected` cards may become invalid, since we
        // could have raced and selected cards that we just played.
        //
        // In that case, let's fix the selected cards.
        var hand = currentPlayer.id in playPhase.hands.hands
            ? Play_assign({}, playPhase.hands.hands[currentPlayer.id]) : {};
        selected.forEach(function (card) {
            if (card in hand) {
                hand[card] = hand[card] - 1;
            }
            else {
                hand[card] = -1;
            }
        });
        var toRemove = Object.entries(hand)
            .filter(function (x) { return x[1] < 0; })
            .map(function (x) { return x[0]; });
        var newSelected = array.minus(selected, toRemove);
        if (toRemove.length > 0) {
            updateSelectionAndGrouping(newSelected, playPhase.trump, playPhase.propagated.tractor_requirements);
        }
    }, [playPhase.hands.hands, currentPlayer.id, selected]);
    var nextPlayer = playPhase.trick.player_queue[0];
    var lastPlay = playPhase.trick.played_cards[playPhase.trick.played_cards.length - 1];
    var _d = react.useState(false), canPlay = _d[0], setCanPlay = _d[1];
    react.useEffect(function () {
        if (!isSpectator && selected.length > 0) {
            engine
                .canPlayCards({
                trick: playPhase.trick,
                id: currentPlayer.id,
                hands: playPhase.hands,
                cards: selected,
                trick_draw_policy: playPhase.propagated.trick_draw_policy,
            })
                .then(function (playable) {
                // In order to play the first trick, the grouping must be disambiguated!
                if (lastPlay === undefined) {
                    playable = playable && grouping.length === 1;
                }
                playable = playable && !playPhase.game_ended_early;
                setCanPlay(playable);
            })
                .catch(function (error) {
                console.error("Error checking if cards can be played:", error);
                setCanPlay(false);
            });
        }
        else {
            setCanPlay(false);
        }
    }, [
        playPhase.trick,
        currentPlayer.id,
        playPhase.hands,
        selected,
        playPhase.propagated.trick_draw_policy,
        isSpectator,
        lastPlay,
        playPhase.game_ended_early,
        grouping,
        engine,
    ]);
    var isCurrentPlayerTurn = currentPlayer.id === nextPlayer;
    var canTakeBack = lastPlay !== undefined &&
        currentPlayer.id === lastPlay.id &&
        !playPhase.game_ended_early;
    var shouldBeBeeping = props.beepOnTurn && isCurrentPlayerTurn && !playPhase.game_ended_early;
    var remainingCardsInHands = array.sum(Object.values(playPhase.hands.hands).map(function (playerHand) {
        return array.sum(Object.values(playerHand));
    }));
    var noCardsLeft = remainingCardsInHands === 0 && playPhase.trick.played_cards.length === 0;
    var canFinish = noCardsLeft || playPhase.game_ended_early;
    var landlordSuffix = playPhase.propagated.landlord_emoji !== undefined &&
        playPhase.propagated.landlord_emoji !== null &&
        playPhase.propagated.landlord_emoji !== ""
        ? playPhase.propagated.landlord_emoji
        : "(当庄)";
    var landlordTeamSize = playPhase.landlords_team.length;
    var configFriendTeamSize = 0;
    var smallerTeamSize = false;
    if (playPhase.game_mode !== "Tractor") {
        configFriendTeamSize =
            playPhase.game_mode.FindingFriends.num_friends != null
                ? playPhase.game_mode.FindingFriends.num_friends + 1
                : playPhase.propagated.players.length / 2;
        smallerTeamSize = landlordTeamSize < configFriendTeamSize;
    }
    // For now, return unsorted cards since sortAndGroupCards needs to be async
    // This function is used in rendering and needs refactoring to handle async
    var getCardsFromHand = function (pid) {
        var cardsInHand = pid in playPhase.hands.hands
            ? Object.entries(playPhase.hands.hands[pid]).flatMap(function (_a) {
                var c = _a[0], ct = _a[1];
                return Array(ct).fill(c);
            })
            : [];
        // TODO: Make this async or cache the sorted results
        // For now, return all cards in a single group
        return cardsInHand.length > 0
            ? [
                {
                    suit: null, // Will be replaced when async is properly handled
                    cards: cardsInHand,
                },
            ]
            : [];
    };
    var compact = props.compact === true;
    return (react.createElement("div", null,
        shouldBeBeeping ? react.createElement(src_Beeper, null) : null,
        !compact && (react.createElement(react.Fragment, null,
            react.createElement(src_Header, { gameMode: playPhase.propagated.game_mode, chatLink: playPhase.propagated.chat_link }),
            react.createElement(src_Players, { players: playPhase.propagated.players, observers: playPhase.propagated.observers, landlord: playPhase.landlord, landlords_team: playPhase.landlords_team, name: props.name, next: nextPlayer }),
            react.createElement(Trump, { trump: playPhase.trump }),
            react.createElement(src_Friends, { gameMode: playPhase.game_mode, showPlayed: true }),
            playPhase.removed_cards.length > 0 ? (react.createElement("p", null,
                "Note:",
                " ",
                playPhase.removed_cards.map(function (c) { return (react.createElement(src_InlineCard, { key: c, card: c })); }),
                " ",
                "have been removed from the deck")) : null,
            settings.showPointsAboveGame && (react.createElement(ProgressBarDisplay, { points: playPhase.points, penalties: playPhase.penalties, decks: playPhase.decks, trump: playPhase.trump, players: playPhase.propagated.players, landlordTeam: playPhase.landlords_team, landlord: playPhase.landlord, hideLandlordPoints: playPhase.propagated.hide_landlord_points, gameScoringParameters: playPhase.propagated.game_scoring_parameters, smallerTeamSize: smallerTeamSize })),
            react.createElement(Trick, { trick: playPhase.trick, players: playPhase.propagated.players, landlord: playPhase.landlord, landlord_suffix: landlordSuffix, landlords_team: playPhase.landlords_team, next: nextPlayer, name: props.name, showTrickInPlayerOrder: props.showTrickInPlayerOrder }))),
        react.createElement(src_AutoPlayButton, { onSubmit: playCards, playDescription: grouping.length === 1 && lastPlay === undefined
                ? grouping[0].description
                : null, canSubmit: canPlay, currentWinner: playPhase.trick.current_winner, unsetAutoPlayWhenWinnerChanges: props.unsetAutoPlayWhenWinnerChanges, isCurrentPlayerTurn: isCurrentPlayerTurn }),
        playPhase.propagated.play_takeback_policy === "AllowPlayTakeback" && (react.createElement("button", { className: "big", onClick: takeBackCards, disabled: !canTakeBack }, "Take back last play")),
        react.createElement("button", { className: "big", onClick: endTrick, disabled: playPhase.trick.player_queue.length > 0 || playPhase.game_ended_early }, "Finish trick"),
        playPhase.game_ended_early && (react.createElement("p", { className: "game-ended-early" }, "The remaining cards can't change the result, so this round is over")),
        canFinish && (react.createElement("button", { className: "big", onClick: startNewGame }, "Finish game")),
        react.createElement(src_BeepButton, null),
        !compact && canFinish && !noCardsLeft && (react.createElement("div", null,
            react.createElement("p", null, "Cards remaining (that were not played):"),
            playPhase.propagated.players.map(function (p) { return (react.createElement(src_LabeledPlay, { key: p.id, trump: playPhase.trump, label: p.name, cards: getCardsFromHand(p.id).flatMap(function (g) { return g.cards; }) })); }))),
        !canFinish && (react.createElement(react.Fragment, null,
            playPhase.trick.trick_format !== null &&
                !isSpectator &&
                playPhase.trick.player_queue.includes(currentPlayer.id) ? (react.createElement(TrickFormatHelper, { format: playPhase.trick.trick_format, hands: playPhase.hands, playerId: currentPlayer.id, trickDrawPolicy: playPhase.propagated.trick_draw_policy, setSelected: function (newSelected) {
                    updateSelectionAndGrouping(newSelected, playPhase.trump, playPhase.propagated.tractor_requirements);
                } })) : null,
            lastPlay === undefined &&
                isCurrentPlayerTurn &&
                grouping.length > 1 && (react.createElement("div", null,
                react.createElement("p", null, "It looks like you are making a play that can be interpreted in multiple ways!"),
                react.createElement("p", null, "Which of the following did you mean?"),
                grouping.map(function (g, gidx) { return (react.createElement("button", { key: gidx, onClick: function (evt) {
                        evt.preventDefault();
                        setGrouping([g]);
                    }, className: "big" }, g.description)); }))),
            react.createElement(src_Cards, { hands: playPhase.hands, playerId: currentPlayer.id, trump: playPhase.trump, selectedCards: selected, onSelect: function (newSelected) {
                    updateSelectionAndGrouping(newSelected, playPhase.trump, playPhase.propagated.tractor_requirements);
                }, notifyEmpty: isCurrentPlayerTurn }))),
        !compact &&
            playPhase.last_trick !== undefined &&
            playPhase.last_trick !== null &&
            props.showLastTrick ? (react.createElement("div", null,
            react.createElement("p", null, "Previous trick"),
            react.createElement(Trick, { trick: playPhase.last_trick, players: playPhase.propagated.players, landlord: playPhase.landlord, landlord_suffix: landlordSuffix, landlords_team: playPhase.landlords_team, name: props.name, showTrickInPlayerOrder: props.showTrickInPlayerOrder }))) : null,
        !compact && playPhase.propagated.game_scoring_parameters ? (react.createElement(src_Points, { points: playPhase.points, penalties: playPhase.penalties, decks: playPhase.decks || [], players: playPhase.propagated.players, landlordTeam: playPhase.landlords_team, landlord: playPhase.landlord, trump: playPhase.trump, hideLandlordPoints: playPhase.propagated.hide_landlord_points || false, gameScoringParameters: playPhase.propagated.game_scoring_parameters, smallerTeamSize: smallerTeamSize })) : null,
        !compact && (react.createElement(src_LabeledPlay, { trump: playPhase.trump, className: "kitty", cards: playPhase.kitty, label: "\u5E95\u724C" }))));
};
var HelperContents = function (props) {
    var engine = useEngine();
    var _a = react.useState([]), decomp = _a[0], setDecomp = _a[1];
    var _b = react.useState(true), loading = _b[0], setLoading = _b[1];
    react.useEffect(function () {
        var cancelled = false;
        setLoading(true);
        engine
            .decomposeTrickFormat({
            trick_format: props.format,
            hands: props.hands,
            player_id: props.playerId,
            trick_draw_policy: props.trickDrawPolicy,
        })
            .then(function (result) {
            if (!cancelled) {
                setDecomp(result);
                setLoading(false);
            }
        })
            .catch(function (error) {
            console.error("Error decomposing trick format:", error);
            if (!cancelled) {
                setDecomp([]);
                setLoading(false);
            }
        });
        return function () {
            cancelled = true;
        };
    }, [
        props.format,
        props.hands,
        props.playerId,
        props.trickDrawPolicy,
        engine,
    ]);
    if (loading) {
        return react.createElement("div", null, "Loading...");
    }
    if (props.format.is_rainbow) {
        var rainbows = decomp.filter(function (d) { return d.playable.length > 0; });
        return (react.createElement(react.Fragment, null,
            react.createElement("p", null,
                react.createElement("strong", null, "\uD83C\uDF08 Rainbow trick!"),
                " The leader played cards all of the same rank spanning at least 4 suits."),
            react.createElement("p", null,
                "If you have a ",
                react.createElement("em", null, "rainbow"),
                " \u2014 the same number of cards as the trick, all of the same rank \u2014 you ",
                react.createElement("strong", null, "must"),
                " play one."),
            react.createElement("p", null, "The highest-rank rainbow wins. If no follower plays a rainbow, the leader wins."),
            rainbows.length > 0 ? (react.createElement(react.Fragment, null,
                react.createElement("p", null, "You can play:"),
                react.createElement("ul", null, rainbows.map(function (r, idx) { return (react.createElement("li", { key: idx },
                    react.createElement("span", { style: { cursor: "pointer" }, onClick: function () { return props.setSelected(r.playable); } }, r.playable.map(function (c, cidx) { return (react.createElement(src_InlineCard, { key: cidx, card: c })); })))); })))) : (react.createElement("p", null, "You have no rainbow \u2014 you may play any cards."))));
    }
    if (decomp.length === 0) {
        return react.createElement("div", null, "Unable to analyze format");
    }
    var trickSuit = props.format.suit;
    var bestMatch = decomp.findIndex(function (d) { return d.playable.length > 0; });
    var modalContents = (react.createElement(react.Fragment, null,
        react.createElement("p", null,
            "In order to win, you have to play ",
            decomp[0].description,
            " in ",
            trickSuit),
        decomp[0].playable.length > 0 && (react.createElement("p", null,
            "It looks like you are able to match this format, e.g. with",
            " ",
            react.createElement("span", { style: { cursor: "pointer" }, onClick: function () { return props.setSelected(decomp[0].playable); } }, decomp[0].playable.map(function (c, cidx) { return (react.createElement(src_InlineCard, { key: cidx, card: c })); })))),
        decomp.length > 1 && props.trickDrawPolicy !== "NoFormatBasedDraw" && (react.createElement(react.Fragment, null,
            react.createElement("p", null,
                "If you can't play that, but you ",
                react.createElement("em", null, "can"),
                " play one of the following, you have to play it"),
            react.createElement("ol", null, decomp.slice(1).map(function (d, idx) { return (react.createElement("li", { key: idx, style: {
                    fontWeight: idx === bestMatch - 1 ? "bold" : "normal",
                } },
                d.description,
                " in ",
                trickSuit,
                idx === bestMatch - 1 && (react.createElement(react.Fragment, null,
                    " ",
                    react.createElement("span", { style: { cursor: "pointer" }, onClick: function () { return props.setSelected(d.playable); } },
                        "(for example:",
                        " ",
                        d.playable.map(function (c, cidx) { return (react.createElement(src_InlineCard, { key: cidx, card: c })); }),
                        ")"))))); })))),
        react.createElement("p", { style: {
                fontWeight: bestMatch < 0 ? "bold" : "normal",
            } },
            "Otherwise, you have to play as many ",
            trickSuit,
            " as you can. The remaining cards can be anything."),
        trickSuit !== "Trump" && (react.createElement("p", null,
            "If you have no cards in ",
            trickSuit,
            ", you can play",
            " ",
            decomp[0].description,
            " in Trump to potentially win the trick."))));
    return modalContents;
};
var TrickFormatHelper = function (props) {
    var engine = useEngine();
    var _a = react.useState(false), modalOpen = _a[0], setModalOpen = _a[1];
    var _b = react.useState(""), message = _b[0], setMessage = _b[1];
    var _c = react.useState(false), isLoading = _c[0], setIsLoading = _c[1];
    react.useEffect(function () {
        setMessage("");
    }, [props.hands]);
    return (react.createElement(react.Fragment, null,
        react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "helpTip", place: "top" }),
        react.createElement("button", { "data-tooltip-id": "helpTip", "data-tooltip-content": "Get help on what you can play", className: "big", onClick: function (evt) {
                evt.preventDefault();
                setModalOpen(true);
            } }, "?"),
        react.createElement(react_tooltip_min/* Tooltip */.m_, { id: "suggestTip", place: "top" }),
        react.createElement("button", { "data-tooltip-id": "suggestTip", "data-tooltip-content": "Suggest a play (not guaranteed to succeed)", className: "big", disabled: isLoading, onClick: function (evt) { return Play_awaiter(void 0, void 0, void 0, function () {
                var decomp, bestMatch, error_2;
                return Play_generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            setIsLoading(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, engine.decomposeTrickFormat({
                                    trick_format: props.format,
                                    hands: props.hands,
                                    player_id: props.playerId,
                                    trick_draw_policy: props.trickDrawPolicy,
                                })];
                        case 2:
                            decomp = _a.sent();
                            bestMatch = decomp.findIndex(function (d) { return d.playable.length > 0; });
                            if (bestMatch >= 0) {
                                props.setSelected(decomp[bestMatch].playable);
                                setMessage("success");
                                setTimeout(function () { return setMessage(""); }, 500);
                            }
                            else {
                                setMessage("cannot suggest a play");
                                setTimeout(function () { return setMessage(""); }, 2000);
                            }
                            return [3 /*break*/, 5];
                        case 3:
                            error_2 = _a.sent();
                            console.error("Error getting play suggestion:", error_2);
                            setMessage("error suggesting play");
                            setTimeout(function () { return setMessage(""); }, 2000);
                            return [3 /*break*/, 5];
                        case 4:
                            setIsLoading(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); } }, isLoading ? "..." : "✨"),
        react.createElement("span", { style: { color: "red" }, onClick: function () { return setMessage(""); } }, message),
        react.createElement((lib_default()), { isOpen: modalOpen, onRequestClose: function () { return setModalOpen(false); }, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: Play_contentStyle } }, modalOpen && (react.createElement(HelperContents, { format: props.format, hands: props.hands, playerId: props.playerId, trickDrawPolicy: props.trickDrawPolicy, setSelected: function (sel) {
                props.setSelected(sel);
                setModalOpen(false);
            } })))));
};
/* harmony default export */ const src_Play = (Play);

;// ./src/DebugInfo.tsx


var DebugInfo = function (_props) {
    var appState = react.useContext(AppStateContext);
    return (react.createElement("pre", null, JSON.stringify({
        gameState: appState.state.gameState,
        settings: appState.state.settings,
        roomName: appState.state.roomName,
    }, null, 2)));
};
/* harmony default export */ const src_DebugInfo = (DebugInfo);

;// ./src/TitleHandler.tsx


var DEFAULT_TITLE = "Play 升级 / Tractor / 找朋友 / Finding Friends online!";
var TitleHandler = function (props) {
    var settings = react.useContext(SettingsContext);
    react.useEffect(function () {
        if (props.playerName !== undefined &&
            props.playerName !== null &&
            settings.showPlayerName) {
            document.title = "".concat(props.playerName, " | ").concat(DEFAULT_TITLE);
        }
        else {
            document.title = DEFAULT_TITLE;
        }
    }, [props.playerName, settings.showPlayerName]);
    return react.createElement(react.Fragment, null);
};
/* harmony default export */ const src_TitleHandler = (TitleHandler);

;// ./src/ResetButton.tsx


/// The name of the player (or observer) who requested a reset, if any.
var findRequester = function (state) {
    var _a, _b, _c;
    var players = [];
    var observers = [];
    var requested;
    if ("Draw" in state) {
        players = state.Draw.propagated.players;
        observers = state.Draw.propagated.observers;
        requested = state.Draw.player_requested_reset;
    }
    else if ("Exchange" in state) {
        players = state.Exchange.propagated.players;
        observers = state.Exchange.propagated.observers;
        requested = state.Exchange.player_requested_reset;
    }
    else if ("Play" in state) {
        players = state.Play.propagated.players;
        observers = state.Play.propagated.observers;
        requested = state.Play.player_requested_reset;
    }
    if (requested === null || requested === undefined) {
        return undefined;
    }
    // The requester may have become an observer since asking (or, in older
    // rooms, may have asked as one), so look in both lists.
    return ((_b = (_a = players.find(function (p) { return p.id === requested; })) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = observers.find(function (p) { return p.id === requested; })) === null || _c === void 0 ? void 0 : _c.name);
};
var ResetButton = function (props) {
    var _a;
    var send = react.useContext(WebsocketProvider_WebsocketContext).send;
    var requester = findRequester(props.state);
    var ownNames = (_a = props.names) !== null && _a !== void 0 ? _a : [props.name];
    if (requester == null) {
        return (react.createElement("div", { className: "reset-block" },
            react.createElement("a", { href: window.location.href, onClick: function (evt) {
                    evt.preventDefault();
                    send({ Action: "ResetGame" });
                }, title: "Request to return to the game settings screen and re-deal all cards" }, "Reset game")));
    }
    else if (ownNames.includes(requester)) {
        return (react.createElement("div", { className: "reset-block" },
            react.createElement("p", null, "Waiting for confirmation..."),
            react.createElement("a", { href: window.location.href, onClick: function (evt) {
                    evt.preventDefault();
                    send({ Action: "CancelResetGame" });
                }, title: "Continue playing the game" }, "Cancel")));
    }
    else {
        return (react.createElement("div", { className: "reset-block" },
            react.createElement("p", null,
                requester,
                " wants to reset the game"),
            react.createElement("a", { href: window.location.href, onClick: function (evt) {
                    evt.preventDefault();
                    send({ Action: "ResetGame" });
                }, title: "Return to the game settings screen and re-deal all cards", style: {
                    marginRight: "8px",
                } }, "Accept"),
            react.createElement("a", { href: window.location.href, onClick: function (evt) {
                    evt.preventDefault();
                    send({ Action: "CancelResetGame" });
                }, title: "Continue playing the game" }, "Cancel")));
    }
};
/* harmony default export */ const src_ResetButton = (ResetButton);

;// ./src/MatchSummaryModal.tsx





var MatchSummaryModal_contentStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    maxWidth: "560px",
    transform: "translate(-50%, -50%)",
};
/// Shown when a `MatchFinished` broadcast arrives: the final standings, plus
/// the rating changes once the `MatchRated` message follows (it only does
/// for a match that was actually rated). Dismissing it clears both.
var MatchSummaryModal = function () {
    var _a = react.useContext(AppStateContext), state = _a.state, updateState = _a.updateState;
    var finished = state.lastMatchFinished;
    var rated = state.lastMatchRated;
    if (finished === null) {
        return null;
    }
    var close = function () {
        return updateState({ lastMatchFinished: null, lastMatchRated: null });
    };
    return (react.createElement((lib_default()), { isOpen: true, onRequestClose: close, shouldCloseOnOverlayClick: true, shouldCloseOnEsc: true, style: { content: MatchSummaryModal_contentStyle } },
        react.createElement("h2", null, "Match over"),
        react.createElement("p", null,
            "First to rank ",
            finished.firstToRank,
            "."),
        react.createElement("ul", { className: "match-standings" }, finished.standings.map(function (s) { return (react.createElement("li", { key: s.player, className: classnames_default()({ winner: s.winner }), title: s.winner ? "Reached the target rank" : undefined },
            s.winner ? "🏆 " : "",
            react.createElement("strong", null, s.name),
            " \u2014 rank ",
            s.rank,
            " (",
            s.levels,
            " ",
            s.levels === 1 ? "level" : "levels",
            ")")); })),
        rated !== null ? (react.createElement(react.Fragment, null,
            react.createElement("h3", null,
                "Rating changes (",
                rated.mode === "1v1" ? "1v1" : "team",
                " ladder)"),
            react.createElement("ul", { className: "match-rating-changes" }, rated.changes.map(function (c) { return (react.createElement("li", { key: c.username },
                react.createElement("strong", null, c.username),
                " ",
                c.before,
                " \u2192 ",
                c.after,
                " ",
                react.createElement("span", { className: classnames_default()("ratings-update-delta", {
                        up: c.delta > 0,
                        down: c.delta < 0,
                    }) },
                    "(",
                    (0,api/* formatDelta */.CW)(c.delta),
                    ")"))); })))) : (react.createElement("p", { className: "auth-hint" }, "Ratings only move at the end of a rated match; if this one was rated, the changes will appear here in a moment.")),
        react.createElement("button", { className: "normal", onClick: close }, "Close")));
};
/* harmony default export */ const src_MatchSummaryModal = (MatchSummaryModal);

;// ./src/SeatProvider.tsx


/// Rewrites a client message so that a plain `{Action: X}` is performed as
/// the given seat: `{ActionAs: [playerId, X]}`. Every other message shape
/// (`{Message: ...}`, `"Beep"`, `{Kick: ...}`, an existing `ActionAs`, ...)
/// is passed through untouched.
var bindActionToSeat = function (playerId, msg) {
    if (msg !== null &&
        typeof msg === "object" &&
        !Array.isArray(msg) &&
        "Action" in msg &&
        !("ActionAs" in msg)) {
        return { ActionAs: [playerId, msg.Action] };
    }
    return msg;
};
/// Provides a `WebsocketContext` whose `send` binds actions to one seat of a
/// 1v1 connection. Everything rendered underneath (Draw / Exchange / Play,
/// BidArea, Cards, BeepButton, ...) keeps using `WebsocketContext.send` and
/// automatically acts as that seat.
var SeatProvider = function (props) {
    var parent = react.useContext(WebsocketProvider_WebsocketContext);
    var playerId = props.playerId;
    var value = react.useMemo(function () { return ({
        send: function (msg) { return parent.send(bindActionToSeat(playerId, msg)); },
    }); }, [parent, playerId]);
    return (react.createElement(WebsocketProvider_WebsocketContext.Provider, { value: value }, props.children));
};
/// The (possibly seat-bound) send function of the nearest provider.
var useSeatSend = function () {
    return React.useContext(WebsocketContext).send;
};
/* harmony default export */ const src_SeatProvider = (SeatProvider);

;// ./src/Game.tsx
var Game_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Game_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

















var Confetti = react.lazy(function () { return Game_awaiter(void 0, void 0, void 0, function () { return Game_generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, __webpack_require__.e(/* import() */ 410).then(__webpack_require__.bind(__webpack_require__, 8410))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); });
/// The player whose turn it is in the current phase, or null when nobody is
/// specifically "next" (Initialize, or an empty player queue in Play).
var nextPlayerOf = function (gameState) {
    if ("Draw" in gameState) {
        return drawNextPlayer(gameState.Draw);
    }
    if ("Exchange" in gameState) {
        return exchangeNextPlayer(gameState.Exchange);
    }
    if ("Play" in gameState) {
        var queue = gameState.Play.trick.player_queue;
        return queue.length > 0 ? queue[0] : null;
    }
    return null;
};
/// The in-room view: renders the current phase for the seat(s) this
/// connection controls.
///
/// In 1v1 rooms a connection owns both seats of its team (`alice` and
/// `alice (2)`), so the Draw / Exchange / Play phase is rendered once per
/// seat. Each instance sits under a `SeatProvider`, which rewrites every
/// `{Action: X}` it sends into `{ActionAs: [seatId, X]}`; the second
/// instance is `compact` (no duplicated board). The Initialize phase is room
/// settings and is rendered once, as the first seat.
var Game = function (props) {
    var _a = react.useContext(AppStateContext), state = _a.state, updateState = _a.updateState;
    var timerContext = react.useContext(TimerProvider/* TimerContext */.P);
    var gameState = state.gameState;
    // `seats` may still be null if the first `State` beat the `Joined`
    // message; treat that as one seat named `state.name`.
    var seats = state.seats;
    var seatNames = seats !== null && seats.names.length > 0 ? seats.names : [state.name];
    var dualSeat = seats !== null &&
        seats.playerMode === "OneVsOne" &&
        seats.names.length === 2 &&
        seats.playerIds.length === 2;
    var nextPlayer = dualSeat ? nextPlayerOf(gameState) : null;
    var renderPhase = function (name, compact) {
        if ("Draw" in gameState) {
            return (react.createElement(src_Draw, { state: gameState.Draw, playDrawCardSound: state.settings.playDrawCardSound, autodrawSpeedMs: state.settings.autodrawSpeedMs, name: name, setTimeout: timerContext.setTimeout, clearTimeout: timerContext.clearTimeout, compact: compact }));
        }
        if ("Exchange" in gameState) {
            return (react.createElement(src_Exchange, { state: gameState.Exchange, name: name, compact: compact }));
        }
        if ("Play" in gameState) {
            return (react.createElement(src_Play, { playPhase: gameState.Play, name: name, showLastTrick: state.settings.showLastTrick, unsetAutoPlayWhenWinnerChanges: state.settings.unsetAutoPlayWhenWinnerChanges, showTrickInPlayerOrder: state.settings.showTrickInPlayerOrder, beepOnTurn: state.settings.beepOnTurn, compact: compact }));
        }
        return null;
    };
    var phase;
    if ("Initialize" in gameState) {
        phase = react.createElement(src_Initialize, { state: gameState.Initialize, name: seatNames[0] });
    }
    else if (dualSeat && seats !== null) {
        phase = (react.createElement("div", { className: "seats" }, seats.names.map(function (name, idx) {
            var playerId = seats.playerIds[idx];
            var active = nextPlayer !== null && nextPlayer === playerId;
            return (react.createElement(src_SeatProvider, { key: playerId, playerId: playerId },
                react.createElement("div", { className: classnames_default()("seat", { "seat-active": active }) },
                    react.createElement("h3", { className: "seat-heading" },
                        "Seat ",
                        idx + 1,
                        ": ",
                        name,
                        active ? (react.createElement("span", { className: "seat-turn" }, " (your turn)")) : null),
                    renderPhase(name, idx > 0))));
        })));
    }
    else {
        phase = renderPhase(seatNames[0], false);
    }
    return (react.createElement("div", { className: classnames_default()(state.settings.fourColor ? "four-color" : null, state.settings.showCardLabels ? "always-show-labels" : null, state.settings.hideChatBox ? "hide-chat-box" : null) },
        props.headerMessages,
        react.createElement(src_Errors, { errors: state.errors }),
        react.createElement(src_MatchSummaryModal, null),
        state.confetti !== null ? (react.createElement(react.Suspense, { fallback: null },
            react.createElement(Confetti, { confetti: state.confetti, clearConfetti: function () { return updateState({ confetti: null }); } }))) : null,
        react.createElement("div", { className: "game" },
            "Initialize" in gameState ? null : (react.createElement(src_ResetButton, { state: gameState, name: seatNames[0], names: seatNames })),
            react.createElement(src_RatedBanner, null),
            phase,
            state.settings.showDebugInfo ? react.createElement(src_DebugInfo, null) : null),
        react.createElement(src_Chat, { messages: state.messages }),
        react.createElement("hr", null),
        react.createElement(src_Credits, null),
        react.createElement(src_TitleHandler, { playerName: state.name })));
};
/* harmony default export */ const src_Game = (Game);

;// ./src/Root.tsx







/// The username of the `#user/<username>` route, or null for every other
/// hash (a room code, or nothing).
var accountRouteUsername = function (hash) {
    var trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!trimmed.startsWith("user/")) {
        return null;
    }
    var username = decodeURIComponent(trimmed.slice("user/".length)).trim();
    return username.length > 0 ? username : null;
};
/// `window.location.hash`, kept up to date as the user follows in-page
/// links (`#user/<name>`, "back to the lobby") and uses the back button.
var useHash = function () {
    var _a = react.useState(function () { return window.location.hash; }), hash = _a[0], setHash = _a[1];
    react.useEffect(function () {
        var onHashChange = function () { return setHash(window.location.hash); };
        window.addEventListener("hashchange", onHashChange);
        return function () { return window.removeEventListener("hashchange", onHashChange); };
    }, []);
    return hash;
};
/// Top-level switch between the landing page (sign-in / join room), an
/// account page and the in-room game view. Everything shared (header
/// messages, dark mode) lives here.
var Root = function () {
    var state = react.useContext(AppStateContext).state;
    var accountUsername = accountRouteUsername(useHash());
    var _a = react.useState([]), previousHeaderMessages = _a[0], setPreviousHeaderMessages = _a[1];
    var _b = react.useState(state.headerMessages.length > 0), showHeaderMessages = _b[0], setShowHeaderMessages = _b[1];
    react.useEffect(function () {
        if (state.headerMessages.length > 0 &&
            (previousHeaderMessages.length !== state.headerMessages.length ||
                !previousHeaderMessages.every(function (m, i) { return state.headerMessages[i] === m; }))) {
            setShowHeaderMessages(true);
        }
        else if (state.headerMessages.length === 0) {
            setShowHeaderMessages(false);
        }
        setPreviousHeaderMessages(state.headerMessages);
    }, [state.headerMessages]);
    react.useEffect(function () {
        if (state.settings.darkMode) {
            document.body.classList.add("dark-mode");
        }
        else {
            document.body.classList.remove("dark-mode");
        }
        return function () {
            document.body.classList.remove("dark-mode");
        };
    }, [state.settings.darkMode]);
    var headerMessages = showHeaderMessages ? (react.createElement("div", { className: "header-message", onClick: function () { return setShowHeaderMessages(false); } }, state.headerMessages.map(function (msg, idx) { return (react.createElement("p", { key: idx }, msg)); }))) : null;
    if (accountUsername !== null) {
        return (react.createElement("div", null,
            headerMessages,
            react.createElement(src_AccountPage, { username: accountUsername }),
            react.createElement("hr", null),
            react.createElement(src_Credits, null),
            react.createElement(src_TitleHandler, { playerName: state.name })));
    }
    if (state.gameState !== null && state.roomName.length === 16) {
        if (state.connected) {
            return react.createElement(src_Game, { headerMessages: headerMessages });
        }
        return (react.createElement(react.Fragment, null,
            react.createElement("p", null, "It looks like you got disconnected from the server, please refresh! If the game is still ongoing, you should be able to re-join with the same account and pick up where you left off.")));
    }
    else {
        return (react.createElement("div", null,
            headerMessages,
            react.createElement(src_Landing, null),
            react.createElement("hr", null),
            react.createElement(src_Credits, null),
            react.createElement(src_TitleHandler, { playerName: state.name })));
    }
};
/* harmony default export */ const src_Root = (Root);

;// ./src/index.tsx
var src_extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var src_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var src_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};









var WasmProvider = react.lazy(function () { return src_awaiter(void 0, void 0, void 0, function () { return src_generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 671))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); });
/// Minimal error boundary (replaces the Sentry one upstream used). Renders
/// `fallback` once anything below it throws during render.
var ErrorBoundary = /** @class */ (function (_super) {
    src_extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { hasError: false };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function () {
        return { hasError: true };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, info) {
        console.error("Uncaught error in React tree:", error, info);
    };
    ErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(react.Component));
var bootstrap = function () {
    var root = document.getElementById("root");
    var fallback = (react.createElement(react.Fragment, null, "An error has occured, please try refreshing! If that doesn't resolve the issue, consider using the latest version of Mozilla Firefox or Google Chrome browsers."));
    lib_default().setAppElement(root);
    var root_ = (0,client.createRoot)(root);
    root_.render(react.createElement(ErrorBoundary, { fallback: fallback },
        react.createElement(react.Suspense, { fallback: "loading..." },
            react.createElement(WasmProvider, null,
                react.createElement(TimerProvider/* default */.A, null,
                    react.createElement(src_AppStateProvider, null,
                        react.createElement(AuthBootstrap, null),
                        react.createElement(src_WebsocketProvider, null,
                            react.createElement(ErrorBoundary, { fallback: fallback },
                                react.createElement(src_Root, null)))))))));
};
bootstrap();


/***/ }),

/***/ 4300:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ab: () => (/* binding */ googleSignIn),
/* harmony export */   CW: () => (/* binding */ formatDelta),
/* harmony export */   Ie: () => (/* binding */ logoutAll),
/* harmony export */   WG: () => (/* binding */ setToken),
/* harmony export */   Xq: () => (/* binding */ formatRating),
/* harmony export */   Yq: () => (/* binding */ formatDate),
/* harmony export */   eH: () => (/* binding */ isNeedsUsername),
/* harmony export */   eO: () => (/* binding */ fetchProfile),
/* harmony export */   gJ: () => (/* binding */ errorMessage),
/* harmony export */   gf: () => (/* binding */ getToken),
/* harmony export */   hD: () => (/* binding */ ApiError),
/* harmony export */   il: () => (/* binding */ TOKEN_KEY),
/* harmony export */   k6: () => (/* binding */ formatRatingWithRecord),
/* harmony export */   kK: () => (/* binding */ fetchLeaderboard),
/* harmony export */   me: () => (/* binding */ me),
/* harmony export */   pE: () => (/* binding */ devLogin),
/* harmony export */   po: () => (/* binding */ formatWinLossDraw),
/* harmony export */   ri: () => (/* binding */ logout),
/* harmony export */   rk: () => (/* binding */ fetchAuthConfig),
/* harmony export */   vJ: () => (/* binding */ googleComplete),
/* harmony export */   wE: () => (/* binding */ deviceId),
/* harmony export */   y0: () => (/* binding */ apiUrl),
/* harmony export */   yq: () => (/* binding */ wsUrl)
/* harmony export */ });
/* unused harmony exports NOT_SIGNED_IN, apiHost, isNotSignedIn, apiFetch, formatRecord */
// Backend location and authenticated fetch helpers.
//
// The static (GitHub Pages) build reads the backend origin from
// `window._API_HOST`, set by `runtime.js`. An empty string / null means
// "same origin as this page" (the backend serving the frontend itself).
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function isNeedsUsername(r) {
    return r.needs_username === true;
}
/// localStorage key of the session token. Exported so AuthBootstrap can
/// watch for it changing in another tab (the `storage` event).
var TOKEN_KEY = "auth_token";
var DEVICE_KEY = "device_id";
/// The documented body of a 401 from an authenticated endpoint whose token
/// is missing, unknown or expired.
var NOT_SIGNED_IN = "not signed in";
/// Origin of the backend, without a trailing slash. "" = same origin.
function apiHost() {
    var host = window._API_HOST;
    if (typeof host === "string" && host.length > 0) {
        return host.replace(/\/+$/, "");
    }
    return "";
}
/// Absolute URL for a backend path such as "/api/auth/me" or
/// "public_games.json". Relative paths are resolved against the page's
/// directory when the API is same-origin (the app lives under /shengji/).
function apiUrl(path) {
    var host = apiHost();
    if (host !== "") {
        return host + (path.startsWith("/") ? path : "/" + path);
    }
    if (path.startsWith("/")) {
        var dir = location.pathname.endsWith("/")
            ? location.pathname
            : location.pathname.replace(/[^/]*$/, "");
        return dir.replace(/\/$/, "") + path;
    }
    return path;
}
/// WebSocket URL for the game endpoint.
function wsUrl() {
    var host = apiHost();
    if (host !== "") {
        return (host.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://") +
            "/api");
    }
    return ((location.protocol === "https:" ? "wss://" : "ws://") +
        location.host +
        location.pathname +
        (location.pathname.endsWith("/") ? "api" : "/api"));
}
function getToken() {
    try {
        return window.localStorage.getItem(TOKEN_KEY);
    }
    catch (_a) {
        return null;
    }
}
function setToken(token) {
    try {
        if (token === null) {
            window.localStorage.removeItem(TOKEN_KEY);
        }
        else {
            window.localStorage.setItem(TOKEN_KEY, token);
        }
    }
    catch (_a) {
        // ignore (private mode etc.)
    }
}
/// A random per-browser identifier, sent on login and room join as a cheap
/// "same device" signal for alt detection. Not a secret.
function deviceId() {
    try {
        var id = window.localStorage.getItem(DEVICE_KEY);
        if (id === null || id.length === 0) {
            var arr = new Uint8Array(16);
            window.crypto.getRandomValues(arr);
            id = Array.from(arr, function (d) { return ("0" + d.toString(16)).slice(-2); }).join("");
            window.localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    }
    catch (_a) {
        return "";
    }
}
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(status, message) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        // TS targets ES5: restore the prototype chain so `instanceof` works.
        Object.setPrototypeOf(_this, ApiError.prototype);
        return _this;
    }
    return ApiError;
}(Error));

/// True when `e` is the server telling us our session token is no longer
/// valid (as opposed to, say, a wrong password on the login form).
function isNotSignedIn(e) {
    return (e instanceof ApiError && e.status === 401 && e.message === NOT_SIGNED_IN);
}
/// Human-readable error text for anything thrown by `apiFetch`.
function errorMessage(e) {
    if (e instanceof ApiError) {
        return e.message;
    }
    if (e instanceof Error) {
        return e.message.length > 0 ? e.message : "request failed";
    }
    return "request failed";
}
/// fetch() against the backend. Adds the bearer token when signed in, sends
/// JSON bodies, parses JSON responses, and throws ApiError with the
/// server's `error` message on non-2xx. Never sends cookies.
///
/// `init.token` sends that session token instead of the stored one (the
/// in-memory session of a tab whose stored token was replaced or removed
/// by another tab); by default the stored token is used.
///
/// A 401 whose body is the documented "not signed in" clears the stored
/// token if it is the one that was sent (the session is dead either way);
/// the caller is responsible for clearing `AppState.auth`.
function apiFetch(path_1) {
    return __awaiter(this, arguments, void 0, function (path, init) {
        var headers, body, token, sendAuth, response, text, parsed, message;
        var _a;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    headers = {};
                    if (init.body !== undefined) {
                        headers["Content-Type"] = "application/json";
                        body = JSON.stringify(init.body);
                    }
                    token = init.token !== undefined && init.token !== null ? init.token : getToken();
                    sendAuth = init.auth !== false && token !== null;
                    if (sendAuth) {
                        headers["Authorization"] = "Bearer " + token;
                    }
                    return [4 /*yield*/, fetch(apiUrl(path), {
                            method: (_a = init.method) !== null && _a !== void 0 ? _a : (init.body !== undefined ? "POST" : "GET"),
                            headers: headers,
                            body: body,
                            credentials: "omit",
                        })];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _b.sent();
                    parsed = null;
                    if (text.length > 0) {
                        try {
                            parsed = JSON.parse(text);
                        }
                        catch (_c) {
                            parsed = null;
                        }
                    }
                    if (!response.ok) {
                        message = parsed !== null && typeof parsed.error === "string"
                            ? parsed.error
                            : "request failed (".concat(response.status, ")");
                        if (sendAuth &&
                            response.status === 401 &&
                            message === NOT_SIGNED_IN &&
                            getToken() === token) {
                            setToken(null);
                        }
                        throw new ApiError(response.status, message);
                    }
                    return [2 /*return*/, parsed];
            }
        });
    });
}
// --- typed wrappers for the endpoints in DESIGN.md ("HTTP API") ---------
var authConfigPromise = null;
/// `GET /api/auth/config`, fetched once per page load and shared.
function fetchAuthConfig() {
    if (authConfigPromise === null) {
        authConfigPromise = apiFetch("/api/auth/config", {
            auth: false,
        }).catch(function (e) {
            // Let a later caller retry (e.g. the backend was still starting).
            authConfigPromise = null;
            throw e;
        });
    }
    return authConfigPromise;
}
function googleSignIn(credential) {
    return apiFetch("/api/auth/google", {
        auth: false,
        body: { credential: credential, device_id: deviceId() },
    });
}
function googleComplete(pending, username) {
    return apiFetch("/api/auth/google/complete", {
        auth: false,
        body: { pending: pending, username: username, device_id: deviceId() },
    });
}
/// `POST /api/auth/dev_login`. Only reachable when the server sets
/// `DEV_LOGIN=1` (local development); a 404 means it is off.
function devLogin(username) {
    return apiFetch("/api/auth/dev_login", {
        auth: false,
        body: { username: username, device_id: deviceId() },
    });
}
function me() {
    return apiFetch("/api/auth/me");
}
/// Revoke the session. Pass the in-memory session token (`AppState.auth
/// .token`) so that signing out still reaches the server after another
/// tab has removed or replaced the stored token; without it the stored
/// token is used.
function logout(token) {
    return apiFetch("/api/auth/logout", { method: "POST", token: token });
}
function logoutAll(token) {
    return apiFetch("/api/auth/logout_all", { method: "POST", token: token });
}
function fetchLeaderboard(mode, limit) {
    if (limit === void 0) { limit = 50; }
    return apiFetch("/api/leaderboard?mode=".concat(encodeURIComponent(mode), "&limit=").concat(limit), { auth: false });
}
/// `GET /api/users/:username` (public). A 404 means there is no such
/// account.
function fetchProfile(username) {
    return apiFetch("/api/users/".concat(encodeURIComponent(username)), {
        auth: false,
    });
}
/// `1512`. Ratings are plain integers: no rating deviation, no provisional
/// period.
function formatRating(r) {
    if (r === null || r === undefined) {
        return "—";
    }
    return "".concat(r.rating);
}
/// `2–1` (wins–losses), or `2–1–1` when there are draws.
function formatRecord(r) {
    if (r === null || r === undefined) {
        return "—";
    }
    var record = "".concat(r.wins, "\u2013").concat(r.losses);
    return r.draws > 0 ? "".concat(record, "\u2013").concat(r.draws) : record;
}
/// `2–1–0` (wins–losses–draws), for a table column of its own.
function formatWinLossDraw(r) {
    if (r === null || r === undefined) {
        return "—";
    }
    return "".concat(r.wins, "\u2013").concat(r.losses, "\u2013").concat(r.draws);
}
/// `1512 (3 matches, 2–1)`, or `1500 (no matches yet)`.
function formatRatingWithRecord(r) {
    if (r === null || r === undefined) {
        return "—";
    }
    if (r.matches === 0) {
        return "".concat(r.rating, " (no matches yet)");
    }
    var matches = r.matches === 1 ? "1 match" : "".concat(r.matches, " matches");
    return "".concat(r.rating, " (").concat(matches, ", ").concat(formatRecord(r), ")");
}
/// `+180` / `−180` (a real minus sign), for a rating change.
function formatDelta(delta) {
    return delta < 0 ? "\u2212".concat(Math.abs(delta)) : "+".concat(delta);
}
/// A unix-seconds timestamp as a local date, e.g. "18 Sep 2026".
function formatDate(unixSeconds) {
    var date = new Date(unixSeconds * 1000);
    if (isNaN(date.getTime())) {
        return "unknown";
    }
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}


/***/ }),

/***/ 6649:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ isWasmAvailable)
/* harmony export */ });
function isWasmAvailable() {
    // Check for URL parameter to force no-WASM mode
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("no-wasm") === "true") {
        console.log("No-WASM mode enabled via URL parameter");
        return false;
    }
    try {
        if (typeof WebAssembly === "object" &&
            typeof WebAssembly.instantiate === "function") {
            var module_1 = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module_1 instanceof WebAssembly.Module) {
                return new WebAssembly.Instance(module_1) instanceof WebAssembly.Instance;
            }
        }
    }
    catch (e) {
        console.warn("WebAssembly not available:", e);
    }
    return false;
}


/***/ }),

/***/ 7236:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ preloadedCards)
});

;// ./src/generated/cards.json
const cards_namespaceObject = /*#__PURE__*/JSON.parse('{"k":[{"value":"🃁","display_value":"🃁","typ":"♢","number":"A","points":0},{"value":"🃎","display_value":"🃎","typ":"♢","number":"K","points":10},{"value":"🃍","display_value":"🃍","typ":"♢","number":"Q","points":0},{"value":"🃋","display_value":"🃋","typ":"♢","number":"J","points":0},{"value":"🃊","display_value":"🃊","typ":"♢","number":"10","points":10},{"value":"🃉","display_value":"🃉","typ":"♢","number":"9","points":0},{"value":"🃈","display_value":"🃈","typ":"♢","number":"8","points":0},{"value":"🃇","display_value":"🃇","typ":"♢","number":"7","points":0},{"value":"🃆","display_value":"🃆","typ":"♢","number":"6","points":0},{"value":"🃅","display_value":"🃅","typ":"♢","number":"5","points":5},{"value":"🃄","display_value":"🃄","typ":"♢","number":"4","points":0},{"value":"🃃","display_value":"🃃","typ":"♢","number":"3","points":0},{"value":"🃂","display_value":"🃂","typ":"♢","number":"2","points":0},{"value":"🃑","display_value":"🃑","typ":"♧","number":"A","points":0},{"value":"🃞","display_value":"🃞","typ":"♧","number":"K","points":10},{"value":"🃝","display_value":"🃝","typ":"♧","number":"Q","points":0},{"value":"🃛","display_value":"🃛","typ":"♧","number":"J","points":0},{"value":"🃚","display_value":"🃚","typ":"♧","number":"10","points":10},{"value":"🃙","display_value":"🃙","typ":"♧","number":"9","points":0},{"value":"🃘","display_value":"🃘","typ":"♧","number":"8","points":0},{"value":"🃗","display_value":"🃗","typ":"♧","number":"7","points":0},{"value":"🃖","display_value":"🃖","typ":"♧","number":"6","points":0},{"value":"🃕","display_value":"🃕","typ":"♧","number":"5","points":5},{"value":"🃔","display_value":"🃔","typ":"♧","number":"4","points":0},{"value":"🃓","display_value":"🃓","typ":"♧","number":"3","points":0},{"value":"🃒","display_value":"🃒","typ":"♧","number":"2","points":0},{"value":"🂱","display_value":"🂱","typ":"♡","number":"A","points":0},{"value":"🂾","display_value":"🂾","typ":"♡","number":"K","points":10},{"value":"🂽","display_value":"🂽","typ":"♡","number":"Q","points":0},{"value":"🂻","display_value":"🂻","typ":"♡","number":"J","points":0},{"value":"🂺","display_value":"🂺","typ":"♡","number":"10","points":10},{"value":"🂹","display_value":"🂹","typ":"♡","number":"9","points":0},{"value":"🂸","display_value":"🂸","typ":"♡","number":"8","points":0},{"value":"🂷","display_value":"🂷","typ":"♡","number":"7","points":0},{"value":"🂶","display_value":"🂶","typ":"♡","number":"6","points":0},{"value":"🂵","display_value":"🂵","typ":"♡","number":"5","points":5},{"value":"🂴","display_value":"🂴","typ":"♡","number":"4","points":0},{"value":"🂳","display_value":"🂳","typ":"♡","number":"3","points":0},{"value":"🂲","display_value":"🂲","typ":"♡","number":"2","points":0},{"value":"🂡","display_value":"🂡","typ":"♤","number":"A","points":0},{"value":"🂮","display_value":"🂮","typ":"♤","number":"K","points":10},{"value":"🂭","display_value":"🂭","typ":"♤","number":"Q","points":0},{"value":"🂫","display_value":"🂫","typ":"♤","number":"J","points":0},{"value":"🂪","display_value":"🂪","typ":"♤","number":"10","points":10},{"value":"🂩","display_value":"🂩","typ":"♤","number":"9","points":0},{"value":"🂨","display_value":"🂨","typ":"♤","number":"8","points":0},{"value":"🂧","display_value":"🂧","typ":"♤","number":"7","points":0},{"value":"🂦","display_value":"🂦","typ":"♤","number":"6","points":0},{"value":"🂥","display_value":"🂥","typ":"♤","number":"5","points":5},{"value":"🂤","display_value":"🂤","typ":"♤","number":"4","points":0},{"value":"🂣","display_value":"🂣","typ":"♤","number":"3","points":0},{"value":"🂢","display_value":"🂢","typ":"♤","number":"2","points":0},{"value":"🃟","display_value":"🃟","typ":"🃟","number":null,"points":0},{"value":"🃏","display_value":"🃟","typ":"🃏","number":null,"points":0}]}');
;// ./src/preloadedCards.ts

/* harmony default export */ const preloadedCards = (cards_namespaceObject.k);


/***/ }),

/***/ 9625:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6540);
/* harmony import */ var _TimerProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3904);


var Timeout = function (props) {
    var _a = react__WEBPACK_IMPORTED_MODULE_0__.useContext(_TimerProvider__WEBPACK_IMPORTED_MODULE_1__/* .TimerContext */ .P), setTimeout = _a.setTimeout, clearTimeout = _a.clearTimeout;
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(function () {
        var timeout = setTimeout(props.callback, props.timeout);
        return function () { return clearTimeout(timeout); };
    });
    return null;
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Timeout);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + (chunkId === 61 ? "playing-cards" : chunkId) + "." + {"61":"b9b315f899eab27828a7","410":"7affd7ce6f78fddd33f1","411":"2f742751e11a3485e59b"}[chunkId] + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "shengji:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/wasm loading */
/******/ 	(() => {
/******/ 		__webpack_require__.v = (exports, wasmModuleId, wasmModuleHash, importsObj) => {
/******/ 		
/******/ 			var req = fetch(__webpack_require__.p + "" + wasmModuleHash + ".module.wasm");
/******/ 			var fallback = () => (req
/******/ 				.then((x) => (x.arrayBuffer()))
/******/ 				.then((bytes) => (WebAssembly.instantiate(bytes, importsObj)))
/******/ 				.then((res) => (Object.assign(exports, res.instance.exports))));
/******/ 			return req.then((res) => {
/******/ 				if (typeof WebAssembly.instantiateStreaming === "function") {
/******/ 		
/******/ 					return WebAssembly.instantiateStreaming(res, importsObj)
/******/ 						.then(
/******/ 							(res) => (Object.assign(exports, res.instance.exports)),
/******/ 							(e) => {
/******/ 								if(res.headers.get("Content-Type") !== "application/wasm") {
/******/ 									console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
/******/ 									return fallback();
/******/ 								}
/******/ 								throw e;
/******/ 							}
/******/ 						);
/******/ 				}
/******/ 				return fallback();
/******/ 			});
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			792: 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkshengji"] = self["webpackChunkshengji"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [999], () => (__webpack_require__(4030)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.8883fa9c6ef5f32bbe5e.js.map