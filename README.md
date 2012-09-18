Btrplace Sandbox
===============================

This web application allows to simply test the behavior of BtrPlace.
It first generate a sample configuration. The user can then write
some placement constraints and check BtrPlace fix the configuration when
it is stated as notviable.

- author: Fabien Hermenier
- contact: fabien.hermenier@gmail.com

Installation Notes
-------------------------------

The build process is managed by [maven] (http://maven.apache.org). Once installed:

    $ mvn install

The war file will be located in the `target` directory. It should be deployable
out of the box.

Release notes
-------------------------------

### 1.1 ###
- a 'pin' feature to lock then save a sandbox
- a player to navigate through the reconfiguration process
- bug fixes

### 12 sep. 2012 - 1.0rc4 && 1.0rc5 ###
- Update dependencies
- Addition of an internal repository for non available dependencies.

### 11 sep. 2012 - 1.0rc2 && 1.0rc3 ###
- Spell checking
- minor visual improvements

### 9 sep. 2012 - 1.0rc1 ###
- Initial release

Copyright
-------------------------------
Copyright (c) 2012 Fabien Hermenier. See `LICENSE.txt` for details.