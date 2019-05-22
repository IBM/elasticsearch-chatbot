#!/bin/bash -e
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
    if ! npm start; then
    	test_failed "$0"
    fi

    test_passed "$0"
}
main "$@" 
