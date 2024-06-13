import { doc, updateDoc } from "firebase/firestore"

import {isFunction, isArray, isObject, has } from "lodash"

import { compilePathTemplate } from "./library/strutils.ts"

const defaultOpAttrs = []

// checks if the variable is a data converter
const isFirestoreConverter = (obj) => {
   return obj && isObject(obj) && has(obj, "fromFirestore") && has(obj, "toFirestore")
}

export const defaultHandler = (docRef, parameters) => {
   const data = parameters.data

   if (!data) throw new Error("Document update needs a data argument")
   
   return updateDoc(docRef, data)
}

/**
 * Returns a function to set Firestore company data.
 * 
 * @param {(string|((parameters: object) => string))} path - Relative path that specifies the document to set
 * @param {(docRef:Object, parameters:Object) => Promise<void>} [handler] - Data mutation handler
 * 
 * @returns {(parameters:Object) => Promise<void>}
 */
export default (rootRef) => (path, ..._args) => async function (parameters) {
   const args = _args.slice()
   // get the compiled document path 
   const documentPath = isFunction(path)
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

   if (converter) console.warn("Converter not implemented yet, see 'addCompanyData'")


   if (documentPath.length <= 1) throw new Error("Document path needs to be not empty")

   // create a document reference relative to the company
   const docRef = doc(rootRef.value, documentPath)

   try {
      return await handler(docRef, parameters)
   } catch (error) {
      throw error
   }
}
