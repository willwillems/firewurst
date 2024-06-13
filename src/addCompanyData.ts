import { collection, addDoc } from "firebase/firestore"

import { isFunction, isArray, isObject, has } from "lodash"

import { compilePathTemplate } from "./library/strutils.ts"

import { AppFormError } from "@/library/errors.js"

const defaultOpAttrs = []

// checks if the variable is a data converter
const isFirestoreConverter = (obj) => {
   return obj && isObject(obj) && has(obj, "fromFirestore") && has(obj, "toFirestore")
}


export const defaultHandler = (colRef, parameters) => {
   const data = parameters.data // TODO: throw warning when data is supplied on the `parameters` directly instead of on the `data`

   if (!data) throw new AppFormError("Document add needs a data argument")
   
   return addDoc(colRef, data)
}

/**
 * Returns a function to set Firestore company data.
 * 
 * @param {(string|((parameters: object) => string))} path - Relative path that specifies the document to set
 * @param {function} [handler] - Data mutation handler
 * 
 * @returns {(parameters:object) => Promise<void>}
 */
export default (rootRef) => (path, ..._args) => async function (parameters) {
   const args = _args.slice()
   // get the compiled document path 
   const collectionPath = isFunction(path)
      ? path(parameters)
      : compilePathTemplate(path, parameters)

   // handler for the data mutation
   const handler = isFunction(args[args.length - 1])
      ? args.pop()
      : defaultHandler

   // op params
   const opAttrs = isArray(args[args.length - 1])
      ? args.pop()
      : defaultOpAttrs

   // firestore converter
   const converter = isFirestoreConverter(opAttrs[0])
      ? opAttrs.shift()
      : null


   if (collectionPath.length <= 1) throw new Error("Collection path needs to be not empty")

   // create a document reference relative to the company
   const docRef = collection(rootRef.value, collectionPath).withConverter(converter)

   try {
      return await handler(docRef, parameters)
   } catch (error) {
      throw new AppFormError(null, { error })
   }
}
