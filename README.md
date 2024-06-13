## Firewurst

```js
// service/userData.js
import { query } from 'firewurst'

const userCollection = computed(() => collection(`users/${userId}`))

export const userCollectionQuery = query(userCollection)

// api/userPosts.js
import { userCollectionQuery } from 'service/userData.js'

const userPostsConverter = {
   toFirestore({ id, ref, ...obj}) { /* ... */ },
   fromFirestore(snapshot, options) { /* ... */ }
}
const isPublishedPost = where("published", "==", true)

export default userCollectionQuery("posts", [ userPostsConverter, isPublishedPost ])

// myPage.vue
import userPostsQuery from 'api/userPosts.js'

const posts = ref([])
const { ready } = userPostsQuery(posts)
await ready.promise
```

