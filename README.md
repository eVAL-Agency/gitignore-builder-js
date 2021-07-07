# GITIgnore Builder (for Javascript)

Simple and modular builder for `.gitignore` files using a variety of templates.

Only a handful of templates are supported at the moment.


## Demo

A [live demo is available](https://eval.agency/tools/gitignore-builder) and is available for public use.


## Using

To use this tool, browse to the [Live Gitignore Builder](https://eval.agency/tools/gitignore-builder),
select your application, IDE, and environment, and copy/paste the generated .gitignore.

Please pay attention to preserve any custom declarations needed.  Just look for the

```
################################################################################
####                                Custom Directives
################################################################################
```

block of text and place them after in your final destination file.


## Dependencies

Prefer to run it on your own server?  Wonderful!  The following dependencies are required to run this application:

* A web server capable of serving static content
* A web browser capable of running Javascript
* .... a coffee?

That's it.  There is no nodejs required, no compiling required, no anything.
The only hard dependency is nodeca's yaml parser, which is included already.

## How it works

`ignores/` contains all gitignore files, plus a `registry` file written in YAML
to provide lookups.  
The javascript retrieves this file on page load and parses it for everything.
Namely, the following keys are used for each record:

* title - Title to display to the user
* file - Relative path in ignores/ of the .gitignore fragment
* desc - Optional description to provide the user with more context
* ref - Optional reference / @see link to include in the generated file

gitignore fragments are broken up in multiple sections, `app`, `env`, `ide`, `os`, and `z_other`.
(Results are rendered alphabetically, so other is z_other to keep it at the end.) 

## Contributions

Merge requests are always welcome, please try to maintain a clean commit though.

## Bug Reporting

Something broke?  Submit a bug report and I may get around to it.
Please be detailed and include browser, environment, or other useful information to replicate the problem.

Heads up, I have absolutely zero expectation that Internet Explorer can run this, so don't even try.

## Embedding

Since this is a simple javascript application, it can very easily be embedded into a
CMS or web framework of your choosing.  The important pieces to remember are:

in the head:

```html
<script src="assets/js/js-yaml.js"></script>
<script src="assets/js/gitignore-builder.js"></script>
```

in the body:

```html
<section id="selection-area"></section>
<textarea id="render-area" readonly="readonly"></textarea>
```

in the foot:

```html
<script>IgnoreRegistry.Run('ignores/');</script>
```

The paths will need to be correct for your environment, but that's the gist of it.

## Future Ideas

The underlying logic of this application relies on language-agnostic flat files,
so a server component could be created to provide a CLI-friendly lookup.

oh, and assume MIT license here, (I'll get around to setting that shortly).