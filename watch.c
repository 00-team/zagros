
/*

gcc -c watch.c -std=c11 -O3 -Wall -Wextra -o watch.o
gcc -shared watch.o -o libwatch.so

*/

#include <stdio.h>
#include <unistd.h>
#include <sys/inotify.h>


extern int watch_init(void);
extern void watch_close(int inotify_fd);
extern int watch_check(int inotify_fd, unsigned int output[2]);
extern int watch_add(int inotify_fd, const char *path);
extern int watch_remove(int inotify_fd, int file_fd);


extern int watch_init(void) {
    return inotify_init1(IN_NONBLOCK);
}

extern void watch_close(int inotify_fd) {
    close(inotify_fd);
}

extern int watch_check(int inotify_fd, unsigned int output[2]) {
    struct inotify_event inbuf;
    int res = read(inotify_fd, &inbuf, sizeof(struct inotify_event));
    
    if (res > 0) {
        output[0] = inbuf.wd;
        output[1] = inbuf.mask;
        return 1;
    }

    output[0] = 0;
    output[1] = 0;

    return 0;
}

extern int watch_add(int inotify_fd, const char *path) {
    return inotify_add_watch(inotify_fd, path, IN_MOVE_SELF | IN_MODIFY);
    // return inotify_add_watch(inotify_fd, path, IN_ALL_EVENTS);
}

extern int watch_remove(int inotify_fd, int file_fd) {
    return inotify_rm_watch(inotify_fd, file_fd);
}

