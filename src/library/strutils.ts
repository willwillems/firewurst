/**
 * Compiles a path template with the given parameters.
 * @param {string} path - Path template to compile
 * @param {object} params - Parameters to compile the path with
 * @returns {string} Compiled string
 * @example
 * // Returns "users/123/posts"
 * compilePathTemplate("users/{userId}/posts", { userId: "123" })
 */
export const compilePathTemplate = (path, params) => path.replaceAll(/\{([^\/\{\}]+)\}/gm, (match, p1) => {
   const param = params[p1]
   if (!param) throw new Error(`"${p1}" cannot be empty`)
   return param
})