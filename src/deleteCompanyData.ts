import { deleteDoc, doc } from "firebase/firestore"

import { isFunction } from "lodash"

import { compilePathTemplate } from "./library/strutils.ts"

export const defaultHandler = (docRef) => deleteDoc(docRef)

/**
 * Returns a function to delete Firestore company data.
 * 
 * @param {(string|((parameters: object) => string))} path - Relative path that specifies the document to set
 * @param {function} [handler] - Data mutation handler
 * 
 * @returns {(parameters:object) => Promise<void>}
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
      
   if (documentPath.length <= 1) throw new Error("Document path needs to be not empty")

   // create a document reference relative to the company
   const docRef = doc(rootRef.value, documentPath)

   try {
      return await handler(docRef)
   } catch (error) {
      throw error 
   }
}
