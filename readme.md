# npm tools

This projects manages the [unified][] collective organizations on npm:

*   check org members, admins, and owners: rights, missing, unexpected
*   check repos for the packages in them
*   check teams: missing
*   check team members: missing, unexpected
*   check team packages: missing, unexpected, rights
*   check package collaborators: unexpected, rights

npm’s API is not really documented, see [`npm.md`][npm-md] for API details.

These tools automatically add packages, teams, org members, and team members
where needed, and warns about incorrectly configured entities.

Most of this is hardcoded to work for unified.
In the future we hope to allow other collectives to use this as well.

These tools work well with our [`github-tools`][github-tools].
The plan is to merge them together in some pluggable way in the future.

[unified]: https://github.com/unifiedjs

[github-tools]: https://github.com/unifiedjs/github-tools

[npm-md]: npm.md
