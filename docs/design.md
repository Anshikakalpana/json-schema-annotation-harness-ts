## Order-Independent Comparison

Annotations are compared using Array.some() — making 
the harness naturally order-independent without 
explicit normalization. Hyperjump returns annotations 
in reverse evaluation order (spec-compliant), which 
this approach handles correctly.