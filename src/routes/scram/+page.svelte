<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import LZString from 'lz-string';
  
  let shareData = page.url.searchParams.get('s');
  
  $effect(() => {
    if (shareData) {
      try {
        const sharedConfig = LZString.decompressFromEncodedURIComponent(shareData);
        if (sharedConfig) {
          const json = JSON.parse(sharedConfig);

          const socketUrl = json.server;
          localStorage.setItem('socketUrl', socketUrl);
          const sessionCode = json.code;
          localStorage.setItem('sessionCode', sessionCode);

          goto(resolve('/'));
        }
      } catch (error) {
        console.error('Error while decompressing share data:', error);
      }
    }
  });
</script>