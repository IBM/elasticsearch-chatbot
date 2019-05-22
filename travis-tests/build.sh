#!/bin/bash -e
source "$(dirname "$0")"/../pattern-ci/scripts/resources.sh
main(){
    if ! cd web; then
        test_failed "$0"
    fi
    if ! npm test; then
        test_failed "$0"
    fi
    if ! cd ../app; then
        test_failed "$0"
    fi
    if ! npm test; then
        test_failed "$0"
    fi
    test_passed "$0"
}
main "$@" 
