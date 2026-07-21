<script lang="ts">
  import { browser } from "$app/env";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { Socket } from "$lib/socket";

  const searchParams = browser && page.url.searchParams;
  const socketUrl = browser && localStorage.getItem('socketUrl');
  const id = browser && localStorage.getItem('id');
  const code = searchParams && searchParams.get("code");

  if (id && socketUrl && code) {
    const socket = new Socket(socketUrl);

    socket.io.on('connect', () => {
      socket.io.emit("auth", {
        id,
        code
      });
    });

    socket.io.on('authed', (success) => {
      console.log(`Authorization ${success ? 'succeeded' : 'failed'}`)
      goto(resolve('/'));
    })

    socket.io.connect();
  }
</script>