import { ref, watch, onUnmounted, isRef } from "vue"
import { doc, onSnapshot } from "firebase/firestore"

import { isFunction, isArray } from "lodash"

import { compilePathTemplate } from "./library/strutils.ts"
import { Deferred } from "./library/deferred.ts"

// specifies default behaviour of ssl if not provided as function argument
export const defaultSnapshotListener = (documentSnapshot) => {
   return documentSnapshot.data()
}

/**
 * @typedef {Object} GetResult
 * @property {import('vue').Ref<object>} data - A reactive value containing the Firestore document
 * @property {import('vue').Ref<null|Error>} error - A reactive value either containing an error or null
 * @property {Deferred} ready - Indicates whether the data is ready
 */

/**
 * Returns a function to get Firestore company data.
 * 
 * @param {(string|((parameters: object) => string))} path - Relative path that specifies the document to set
 * @param {object[]} [queryAttrs] - Shares the syntax with the query variant but only one converter can be passed
 * @param {function} [handler] - Snapshot handler
 * 
 * @returns {(data: import('vue').Ref<object>, parameters: object) => GetResult}
 */
export default (rootRef) => (path, ..._args) => function (data, parameters) {
   const args = _args.slice()
   // get the compiled document path 
   const documentPath = isFunction(path)
      ? path(parameters)
      : compilePathTemplate(path, parameters)
      
   if (documentPath.length <= 1) throw new Error("Document path needs to be not empty")

   // handler for the snapshot events
   const snapshotHandler = isFunction(args[args.length - 1])
      ? args.pop()
      : defaultSnapshotListener

   // we can only receive a converter here since we're getting by path
   const [ converter ] = isArray(args[args.length - 1])
      ? args.pop()
      : [ null ]
   
   // Data
   if (!isRef(data)) throw new Error(`No data reference was passed to the get function for: ${documentPath}`)

   // State
   const error = ref(null)
   const ready = new Deferred()

   const setData  = (val) => data.value  = val
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
         // no id, wait for watcher to trigger on id set, do nothing
         if (!_rootRef) return
         // if a listener is already attached
         if (unsub) unsub()

         // create a collection reference relative to the company
         const docRef = doc(_rootRef, documentPath).withConverter(converter)

         unsub = onSnapshot(docRef,
            (...listenerArgs) => {
               // set data based on the hanlder's result
               setData(snapshotHandler(...listenerArgs))
               // resolve the Deffered with a non-reactive version of the data
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
      data,
      error,
      ready
   }
}
