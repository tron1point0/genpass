(function() {
    var KEY_SIZE_DIVISOR = 4,
        KEY_HASHER = CryptoJS.algo.SHA256,
        ITERATIONS = 128;

    var onEnter = function(cb) {
            return function(event) {
                var args = Array.prototype.slice.call(arguments);
                if (13 === event.which) {
                    cb.apply(this,args);
                }
            };
        },
        trigger = function(selector,fn) {
            return function() { $(selector).trigger(fn) }
        },
        is_printing_key_code = function(code) {
            return false !== printing_key_codes.binarySearch(code);
        },
        printing_key_codes = [8,13,46]      // Backspace, Enter, Delete
            .extend(Array.fromTo(48,90))    // '0' .. 'z'
            .extend(Array.fromTo(96,111))   // KP_0 .. KP_Divide
            .extend(Array.fromTo(186,192))  //';' .. '`'
            .extend(Array.fromTo(219,222)); // '[' .. "'"


    $('#password').add('#salt').add('#length').add('#characters')
        .on('change',trigger('#result','generate'))
        .on('keyup',onEnter(trigger('#result','generate')));

    $('#result > input[type=text]')
        .on('keyup',onEnter(trigger('#result','generate')));

    $('#characters')
        .on('allowed.add',function(event,data) {
            $(this).val(
                [data.chars, $(this).val().toCodes()].merge().asString()
            );
            data.next.call(this);
        }).on('allowed.remove',function(event,data) {
            $(this).val(
                $(this).val().toCodes().subtract(data.chars).asString()
            );
            data.next.call(this);
        }).on('blur',function() {
            $(this).val($(this).val().toCodes().mergeSort().asString());
        }).val('');

    $('#result').on('generate',function() {
        if (!($('#salt').val() && $('#password').val())) return;
        var pass = CryptoJS.enc.Hex.stringify(CryptoJS.PBKDF2(
            $('#salt').val(), $('#password').val(), {
                keySize: parseInt($('#length').val())/KEY_SIZE_DIVISOR,
                hasher: KEY_HASHER,
                iterations: ITERATIONS
            })).fromHex().mod($('#characters').val().toBytes());
        $(this).find('input').val(pass)
            .filter('input[type=text]')
            .prop('disabled',false)
            .select().focus();
    });

    $('#result > input[type=text]').on('keydown',function(event) {
        if (is_printing_key_code(event.which) &&
            !(event.ctrlKey || event.altKey || event.metaKey)) {
            event.preventDefault();
        }
        // '=', KP_Equal
        if (false !== [107, 187].binarySearch(event.which)) {
            event.preventDefault();
            return $('#length').val(
                1 + parseInt($('#length').val())
            ).change();
        }
        // '-', KP_Subtract
        if (false !== [109, 189].binarySearch(event.which)) {
            event.preventDefault();
            return $('#length').val(
                -1 + parseInt($('#length').val())
            ).change();
        }
    });

    $('input[type=checkbox][name=allowed]')
        .on('change',function(event) {
            $('#characters').trigger(
                ($(this).prop('checked') ?
                    'allowed.add' :
                    'allowed.remove'
                ),{
                    chars: $(this).val().fromRange(),
                    next: function() {
                        $('#result').trigger('generate')
                    },
                }
            );
        }).trigger('change');
})();

