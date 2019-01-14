dnl required version of autoconf
AC_PREREQ([2.53])

AC_INIT([webrtc], [1.0], [BUG-REPORT-ADDRESS])

# minimum required versions
SASS_VERSION_MIN=3.3.0
SCSS_LINT_VERSION_MIN=0.33.0

AC_CONFIG_MACRO_DIR([m4])

dnl required version of automake
# AM_INIT_AUTOMAKE([1.10])
AM_INIT_AUTOMAKE(webrtc, 1.0)

dnl enable mainainer mode by default
AM_MAINTAINER_MODE([enable])

AC_PROG_MKDIR_P
AC_PROG_GREP
AC_PROG_SED
AC_PROG_AWK

AC_PATH_PROGS([FIND],[find])


AC_PATH_PROGS([SASS],[sass])
if test x"${SASS}" == x"" ; then
    AC_MSG_WARN([Please install sass before trying to build styles.])
else
    AC_MSG_CHECKING([for version of sass])
    SASS_VERSION=`$SASS --version | $SED 's/^Sass //' | $SED 's/ .*//'`
    AC_MSG_RESULT([$SASS_VERSION])
    AX_COMPARE_VERSION([$SASS_VERSION], [lt], [$SASS_VERSION_MIN],
        [AC_MSG_WARN([Please install compass with sass $SASS_VERSION_MIN or newer before trying to build styles (found sass $SASS_VERSION).])
        SASS_SUPPORT_STYLES=no],[SASS_SUPPORT_STYLES=yes])
fi

AC_PATH_PROG([SCSS_LINT],scss-lint, [], [$PWD/node_modules/.bin$PATH_SEPARATOR$PATH])
if test x"${SCSS_LINT}" == x"" ; then
    AC_MSG_WARN([Please install scss-lint to lint styles.])
else
    AC_MSG_CHECKING([for version of scss-lint])
    SCSS_LINT_VERSION=`$SCSS_LINT --version | $SED 's/^scss-lint //' | $SED 's/ .*//'`
    AC_MSG_RESULT([$SCSS_LINT_VERSION])
fi

if test x"${SASS}" != x"" ; then
    AC_MSG_CHECKING([for compass support in sass])
    tempfile=`mktemp -t XXXXXXblah`
    cd src/styles
    $SASS --compass $tempfile > /dev/null 2> /dev/null
    sass_compass=$?
    rm $tempfile
    cd ../../
    if test x"${sass_compass}" != x"0" ; then
        AC_MSG_RESULT([not available])
        AC_MSG_WARN([Please install compass so it can be used using "sass --compass ...".])
        SASS_SUPPORT_STYLES=no
    else
        AC_MSG_RESULT([ok])
    fi
fi
AC_SUBST(SASS_SUPPORT_STYLES)

AC_PATH_PROG([AUTOPREFIXER],autoprefixer, [], [$PWD/node_modules/.bin$PATH_SEPARATOR$PATH])
if test x"${AUTOPREFIXER}" == x"" ; then
    AC_MSG_WARN([Please install autoprefixer before trying to build styles.])
else
    AC_MSG_CHECKING([for version of autoprefixer])
    AUTOPREFIXER_VERSION=`$AUTOPREFIXER --version | $SED 's/^autoprefixer //'`
    AC_MSG_RESULT([$AUTOPREFIXER_VERSION])
fi

AC_CONFIG_FILES([
    Makefile
    styles/Makefile
])
AC_OUTPUT
