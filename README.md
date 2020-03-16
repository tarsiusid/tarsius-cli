# tarsius

## TARSIUS MANIFEST
### Tables
#### Structure
```yaml
tables:
  <name_table>:
    <name_field>:
      <properties>
```
example

```yaml
tables :
  # Create table author
  author:
    id:
      type: serial
      notNull: true
      primaryKey: true
    name:
      type: varchar(100)
      notNull: true
    email:
      type: varchar(150)
      notNull: true
    created:
      type: timestamptz
```

#### Include Table
You can include table resource from other tarsius manifest

```yaml
tables :
  # Create table posts
  author: ../author/tarsius.yml
  post:
    id:
      type: serial
      notNull: true
      primaryKey: true
    title:
      type: varchar(100)
      notNull: true
    content:
      type: text
    authorid:
      type: author.id # Set set authorid as a FK author table
      notNull: true
      isCascade: true
    created:
      type: timestamptz
```
#### Type Data of Field
Type | Description
---|---
bool | A Boolean data type can hold one of three possible values: true, false or null.
varchar | VARCHAR(n) is the variable-length character string.
int | Integer is a numeric types
timestamp | TIMESTAMP stores both date and time values.
timestamptz | TIMESTAMPTZ is a timezone-aware timestamp data type. It is the abbreviation for timestamp with time zone.

#### Properties
properties | description | value
---|---|---
type | Type data of field | `String`
notNull | set field as a `NOT NULL` type | `Bool`
primaryKey | set field as a primary key | `Bool`
isCascade | set field as `ON DELETE CASCADE` and `ON UPDATE CASCADE` | `Bool`
isUnique | set field as `UNIQUE` data | `Bool`


## Create project
#### Create new project
```bash
$ mkdir project-test
$ cd project-test
```

#### Create `tarsius.yml` for data modeling
```yaml
tables :
  # Create table author
  author:
    id:
      type: serial
      notNull: true
      primaryKey: true
    name:
      type: varchar(100)
      notNull: true
    email:
      type: varchar(150)
      notNull: true
    created:
      type: timestamptz

  # Create table post
  post:
    id:
      type: serial
      notNull: true
      primaryKey: true
    title:
      type: varchar(100)
      notNull: true
    content:
      type: text
    authorid:
      type: author.id
      notNull: true
    created:
      type: timestamptz
```
use anchor
```yaml
tables :
  # Create table author
  author:
    id: &idAnchor
      type: serial
      notNull: true
      primaryKey: true
    name: &nameAnchor
      type: varchar(100)
      notNull: true
    email:
      <<: *nameAnchor
    created: &dateAnchor
      type: timestamptz

  # Create table post
  post:
    id:
      <<: *idAnchor
    title:
      <<: *nameAnchor
    content:
      type: text
    authorid:
      # Set joining to `authors` table
      type: author.id
      notNull: true
    created:
      <<: *dateAnchor
```

## SQL

#### Configuration
```bash
$ tarsius sql config
```

#### Create table
```bash
$ tarsius sql create
```

## Initialize your project
```bash
$ tarsius init
or
$ tarsius init -s go -p ../project-directory
```

### Environment Variables

The generated code accepts env vars as well. They are :

- `TS_DB_HOST`
- `TS_DB_PORT`
- `TS_DB_NAME`
- `TS_DB_USER`
- `TS_DB_PASS`
- `TS_CORS_ORIGIN`
- `TS_CORS_METHODS`
- `TS_CORS_HEADERS`

`TS_CORS_ORIGIN` will also automaticaly sets basic CORS methods and headers. You can override them with `TS_CORS_METHODS` and `TS_CORS_HEADERS`.

## Run project
```bash
$ tarsius run
```
Access it on http://localhost:8000

## GraphQL
 Query to get the all authors
```
query {
  authors {
    id
    name
    email
    created
  }
}
```

Query to get a specific author
```
query {
  author(id: 1) {
    id
    name
    email
  }
}
```

Query with pagination
```
query{
  authors(page:1,pageSize:4){
    id
    name
    email
  }
}
```

Create new author using mutation
```
mutation {
  createAuthor(name: "Ibnu Yahya", email: "ibnu@tarsius.id") {
    id
    name
    email
  }
}
```

Update an author using mutation
```
mutation {
  updateAuthor(id: 2, name: "ibnu Yahya", email: "ibnu@tarsius.id") {
    id
    name
    email
  }
}
```

Delete an author using mutation
```
mutation {
  deleteAuthor(id: 2) {
    id
  }
}
```

Query to get the posts with its relation author
```
query {
  posts {
    id
    title
    content
    author {
      id
      name
      email
    }
  }
}
```
