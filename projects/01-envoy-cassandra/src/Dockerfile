FROM cassandra:5.0
RUN sed -i -E \
 -e 's/^#? ?memtable_allocation_type:.*/memtable_allocation_type: offheap_objects/' \
 -e 's/^#? ?memtable_offheap_space:.*/memtable_offheap_space: 768MiB/' \
 -e 's/^#? ?file_cache_size:.*/file_cache_size: 384MiB/' \
 -e 's/^#? ?native_transport_max_concurrent_connections:.*/native_transport_max_concurrent_connections: 150/' \
 /etc/cassandra/cassandra.yaml
