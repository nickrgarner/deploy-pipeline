
function mutateString (mutator, val) {

    // Step 3. Replace single quotes strings with integers
    if (mutator.random().bool(0.5))
    {
        val = val.replace(/'\w+'/g, mutator.random().integer(0, 99));
    }

    var array = val.split('');

    do {
        if( mutator.random().bool(0.25) )
        {
            // Step 1. Randomly remove a random set of characters, from a random start position.
            let randPos = mutator.random().integer(0, 99);
            let randLen = mutator.random().integer(0, 99);
            array.splice(randPos, randLen);
        }
        if( mutator.random().bool(0.25) )
        {
            // Step 2. Randomly add a set of characters.
            let randPos = mutator.random().integer(0, 99);
            let randString = mutator.random().string(10);
            array.splice(randPos, 0, ...randString);
        }
    } while (mutator.random().bool(.25));

    return array.join('');
}

exports.mutateString = mutateString;
