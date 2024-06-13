import { onUnmounted } from "vue"

const linkMap = new Map()

export const linkStore = function (data, getter, params) {
   // check for previous data links
   if (linkMap.has(data)) {
      if (linkMap.get(data) === getter) return Promise.resolve()
      else throw new Error("Data is already linked to another getter")
   }

   const { error, ready } = getter(data, params)

   if (error) Promise.reject(error)
   // add aditional cleanup for link map
   onUnmounted(() => linkMap.delete(data))
   //! we return this promise instead of making this an async function so the component
   //! instance can hook into the onUnmounted hook from the company data getter/querier
   // - link map setter wrapped around ready resolver -
   return ready.promise.then((val) => (linkMap.set(data, getter), val))
}