#!/usr/bin/env perl

use v5.16;
use warnings;

use Digest::SHA qw(hmac_sha256);

sub bytes ($) { my @bytes = unpack 'C*', shift }
sub bytelen ($) { (bytes $_[0]) - 1 }

sub pbkdf2 (&;@) {
    my ($PRF, $password, $salt, $c, $dkLen) = @_;
    my $hLen = bytelen $PRF->(" "," ");
    my $F = sub {
        my ($c, $i) = @_;
        my $U = my $h = $PRF->(($salt . pack 'N', $i), $password);
        $U ^= $h = $PRF->($h, $password) for 2..$c;
        $U;
    };

    return pack "a$dkLen", $F->($c, 1) if $hLen > $dkLen;
    join '', map {$F->($c, $_)} 1 .. (int $dkLen/$hLen);
}

sub with_allowed (&;@) {
    my @chars = shift->();
    map {
        my @bytes = bytes $_;
        join '', map { $chars[$bytes[$_] % @chars] } 0 .. @bytes-1;
    } @_;
}

say with_allowed {0..9,'A'..'Z','a'..'z'}
    pbkdf2 {&hmac_sha256}
        $ARGV[0], $ARGV[1], 128, $ARGV[2];
