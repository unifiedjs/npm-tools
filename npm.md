# npm registry docs

The npm registry (api) isn’t documented very well.
You can find some docs in [`npm/registry`][registry], but most of it can be best
perused by reading code, such as [`libnpmaccess`][libnpmaccess].

…or read this document.

## Table of Contents

* [Authentication](#authentication)
* [Org](#org)
  * [List teams in an org](#list-teams-in-an-org)
  * [List packages in an org](#list-packages-in-an-org)
  * [List users in an org](#list-users-in-an-org)
  * [Add or change a user in an org](#add-or-change-a-user-in-an-org)
  * [Remove a user from an org](#remove-a-user-from-an-org)
* [Team](#team)
  * [Add or change a team](#add-or-change-a-team)
  * [List users in a team](#list-users-in-a-team)
  * [Add a user to a team](#add-a-user-to-a-team)
  * [Remove a user from a team](#remove-a-user-from-a-team)
  * [List packages in a team](#list-packages-in-a-team)
  * [Add or change a package in a team](#add-or-change-a-package-in-a-team)
  * [Remove a package from a team](#remove-a-package-from-a-team)
* [Packages](#packages)
  * [Get a package](#get-a-package)
  * [Get collaborators of a package](#get-collaborators-of-a-package)
  * [Set maintainers for a package](#set-maintainers-for-a-package)
  * [Set 2fa access of a package](#set-2fa-access-of-a-package)
* [Users](#users)
  * [Get the current user (from the token)](#get-the-current-user-from-the-token)
  * [Get a user](#get-a-user)
  * [List packages for a user](#list-packages-for-a-user)

## Authentication

First, make sure to set npm to use 2fa for **auth-only**.
Proper 2fa doesn’t work well as you’d have to fill in OTPs all the time.

```sh
npm profile enable-2fa auth-only
```

Then, create an npm token:

```sh
npm token create
```

Store that somewhere in a dotenv.

## Org

### List teams in an org

```sh
org=remarkjs

curl "https://registry.npmjs.org/-/org/$org/team" \
  -H "Authorization: Bearer $token"
# ["remarkjs:developers","remarkjs:foo"]
```

### List packages in an org

```sh
org=remarkjs

curl "https://registry.npmjs.org/-/org/$org/package"
# {"remark":"write",…"remark-external-links":"write"}
```

### List users in an org

Only users the token can see are shown.

```sh
org=remarkjs

curl "https://registry.npmjs.org/-/org/$org/user" \
  -H "Authorization: Bearer $token"
# {"wooorm":"owner",…"murderlon":"admin"}
```

### Add or change a user in an org

```sh
org=remarkjs
user="wooorm"
role="owner" # "developer", "owner", or "admin"
# See https://docs.npmjs.com/org-roles-and-permissions.

curl "https://registry.npmjs.org/-/org/$org/user" \
  -X PUT \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"user\": \"$user\", \"role\": \"$role\"}"
# {"org":{"name":"remarkjs","size":5},"user":"wooorm","role":"owner"}
```

### Remove a user from an org

```sh
org=remarkjs
user="wooorm"

curl "https://registry.npmjs.org/-/org/$org/user" \
  -X DELETE \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"user\": \"$user\"}"
```

## Team

### Add or change a team

```sh
org=remarkjs
team=bar
description=bravo

curl "https://registry.npmjs.org/-/org/$org/team" \
  -X PUT \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$team\",\"description\": \"$description\"}"
# {"name":"bar"}
```

### List users in a team

```sh
org=remarkjs
team=developers

curl "https://registry.npmjs.org/-/team/$org/$team/user" \
  -H "Authorization: Bearer $token"
# ["wooorm",…]
```

### Add a user to a team

```sh
org=remarkjs
team=foo
user=wooorm

curl "https://registry.npmjs.org/-/team/$org/$team/user" \
  -X PUT \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"user\":\"$user\"}"
# {}
```

### Remove a user from a team

```sh
org=remarkjs
team=foo
user=johno

curl "https://registry.npmjs.org/-/team/$org/$team/user" \
  -X DELETE \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"user\":\"$user\"}"
# empty
```

### List packages in a team

```sh
org=remarkjs
team=developers

curl "https://registry.npmjs.org/-/team/$org/$team/package" \
  -H "Authorization: Bearer $token"
# {"remark":"write",…"remark-external-links":"write"}
```

### Add or change a package in a team

```sh
org=remarkjs
team=foo
package=remark-parse
permissions="read-write" # "read-only" or "read-write"

curl "https://registry.npmjs.org/-/team/$org/$team/package" \
  -X PUT \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"package\": \"$package\", \"permissions\": \"$permissions\"}"
# {}
```

### Remove a package from a team

```sh
org=remarkjs
team=foo
package=remark-parse

curl "https://registry.npmjs.org/-/team/$org/$team/package" \
  -X DELETE \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"package\": \"$package\"}"
# empty response
```

## Packages

### Get a package

```sh
package=remark-parse # Use "@foo%2bar" for scoped packages

curl "https://registry.npmjs.org/$package" \
  -H "Accept: application/vnd.npm.install-v1+json" # Remove for full metadata.
# {"_id":"remark-parse","_rev":"35-c4b211558296c2be5fad20fd0a7b3b25","name":"remark-parse","maintainers":[…],…}
```

This can be used to find `maintainers`.

### Get collaborators of a package

```sh
package=remark-parse

curl "https://registry.npmjs.org/-/package/$package/collaborators" \
  -H "Authorization: Bearer $token"
# {"wooorm":"write",…}
```

### Set maintainers for a package

```sh
package=remark-parse
rev=10-4193cf2ba92283e3e8fd605d75108054

curl "https://registry.npmjs.org/$package/-rev/$rev" \
  -X PUT \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{
    \"_id\": \"$package\",
    \"_rev\": \"$rev\",
    \"maintainers\": [
      {\"email\":\"dev@vincentweevers.nl\",\"name\":\"vweevers\"},
      {\"email\":\"tituswormer@gmail.com\",\"name\":\"wooorm\"}
    ]
  }" \
  --verbose
```

### Set 2fa access of a package

```sh
package=remark-parse
tfa=true # true or false

curl "https://registry.npmjs.org/-/package/$package/access" \
  -X POST \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d "{\"publish_requires_tfa\": $tfa}"
# empty
```

## Users

### Get the current user (from the token)

```sh
curl "https://registry.npmjs.org/-/npm/v1/user" \
  -H "Authorization: Bearer $token"
# {"tfa":{"pending":false,…"fullname":"Titus Wormer",…"twitter":"wooorm","github":"wooorm"}
```

### Get a user

```sh
user=wooorm

curl "https://registry.npmjs.org/-/user/org.couchdb.user:$user"
# {"_id":"org.couchdb.user:wooorm","email":"tituswormer@gmail.com","name":"wooorm"}
```

### List packages for a user

```sh
user=wooorm

curl "https://registry.npmjs.org/-/user/$user/package"
# {"retext-latin":"write",…"remark-bookmarks":"write"}
```

<!-- Definitions -->

[libnpmaccess]: https://github.com/npm/libnpmaccess/blob/latest/index.js

[registry]: https://github.com/npm/registry
