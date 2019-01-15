
SASS=sass
SCSS_LINT=scss-lint
CURDIR=`pwd`
AUTOPREFIXER=autoprefixer
STATIC=../../dist/static
rm -rf $STATIC/css
mkdir -p $STATIC/css


# main.min.css: pre
	$SASS --compass --scss --style=compressed --no-cache --sourcemap=none \
		$CURDIR/main.scss:$STATIC/css/main.min.css
	# $AUTOPREFIXER --browsers "> 1%, last 2 versions, Firefox ESR, Opera 12.1" $(STATIC)/css/main.min.css

# styleshint:
	# find ./ -maxdepth 1 -name "*.scss" -print0 | xargs -0 -n1 sass --compass --scss --style=compressed --no-cache --sourcemap=none -c

# styleslint:
#	find ./ -not -path "./libs/*" -name "*.scss" -print0 | xargs -0 -n1 $SCSS_LINT -c scss.yml
