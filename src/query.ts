import { ref, watch, onUnmounted, isRef } from "vue"
import { collection, onSnapshot, query, where } from "firebase/firestore"

import { isFunction, isObject, isArray, isSymbol, has } from "lodash"

import { Deferred } from "./library/deferred.ts"
// import { customClaimKeys, isAdmin } from "@/store/authenticate.js"
import { compilePathTemplate } from "./library/strutils.ts"

// checks if the variable is a data converter
const isFirestoreConverter = (obj) => {
   return obj && isObject(obj) && has(obj, "fromFirestore") && has(obj, "toFirestore")
}

// specifies default behaviour of ssl if not provided as function argument
export const defaultSnapshotListener = (collectionSnapshot) => {
   return collectionSnapshot.docs.map((doc) => doc.data())
}

// default query constraints
export const defaultQueryConstraints = []

export const AccessQuery = Symbol("access claim query")

const addConstraint = (constraints, symbol) => {
   // if (symbol === AccessQuery) {
   //    if (isAdmin.value) return constraints
   //    return [...constraints, where("access", "array-contains-any", customClaimKeys.value)]
   // }

   return constraints
}


/**
 * @typedef {Object} QueryResult
 * @property {import('vue').Ref<object>} data - A reactive value containing the Firestore documents
 * @property {import('vue').Ref<null|Error>} error - A reactive value either containing an error or null
 * @property {Deferred} ready - Indicates whether the data is ready
 */

/**
 * Returns a function to query Firestore company data.
 * 
 * @param {(string|((parameters: object) => string))} path - Relative path that specifies the document to set
 * @param {object[]} [queryAttrs] - Symbols, converters, and QueryConstraints to apply
 * @param {function} [handler] - Snapshot handler
 * 
 * @returns {(data: import('vue').Ref<array>, parameters:object) => QueryResult}
 */
export default (rootRef) => (path, ..._args) => function (data, parameters) {
   const args = _args.slice()
   // get the compiled document path 
   const collectionPath = isFunction(path)
      ? path(parameters)
      : compilePathTemplate(path, parameters)

   if (collectionPath.length <= 1) throw new Error("Collection path needs to be not empty")

   // handler for the snapshot events
   const snapshotHandler = isFunction(args[args.length - 1])
      ? args.pop()
      : defaultSnapshotListener

   // query params
   const queryAttrs = isArray(args[args.length - 1])
      ? args.pop()
      : defaultQueryConstraints

   // firestore converter
   const [ converter, ...restAttrs ] = isFirestoreConverter(queryAttrs[0])
      ? queryAttrs
      : [ null, ...queryAttrs]

   // map any symbols
   const queryConstraints = restAttrs.reduce((acc, c) => isSymbol(c) ? addConstraint(acc, c) : [...acc, c], [])

   // Data
   if (!isRef(data)) throw new Error(`No data reference was passed to the query function for: ${collectionPath}`)

   // State
   const error = ref(null)
   const ready = new Deferred()
 
   const setData = (val) => data.value = val
   const setError = (err) => error.value = err

   var unsub   = null
   var unwatch = null
   onUnmounted(() => {
      if (unsub)   unsub()
      if (unwatch) unwatch()
   })
   unwatch = watch(
      rootRef,
      (_rootRef) => {
         // if no id, wait for watcher to trigger on id set, do nothing now
         if (!_rootRef) return
         // if a listener is already attached unsub
         if (unsub) unsub()

         // create a collection reference relative to the company
         console.log("_rootRef", _rootRef)
         const collectionRef = collection(_rootRef, collectionPath).withConverter(converter)
         // query on that collection using the relevant constraints
         const q = query(collectionRef, ...queryConstraints)

         unsub = onSnapshot(q,
            async (...listenerArgs) => {
               // set data based on the hanlder's result
               setData(await snapshotHandler(...listenerArgs))
               // resolve the Deffered with a non-reactive version of the data (WARNING: WILL RESEOLVE WITH PARTIAL SNAPSHOT)
               return ready.resolve(data.value)
            }, (handlerError) => {
               // set error when listen fails or is cancled
               setError(handlerError)
               // reject with non-reactive version of error 
               return ready.reject(error.value)
            }
         )
      },
      { immediate: true }
   )

   return {
      error,
      ready
   }
}
