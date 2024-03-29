%global extdir %{_datadir}/gnome-shell/extensions/top-bar@tauos.co

Summary:        Adjust Top Bar for tauOS
Name:           tau-top-bar
# This should match the version in metadata.json
Version:        1
Release:        1.2.8
License:        GPLv3+
URL:            http://tauos.co
Source0:        https://github.com/tau-OS/top-bar/archive/refs/heads/main.zip
BuildArch:      noarch
BuildRequires:  meson
BuildRequires:  %{_bindir}/glib-compile-schemas

Requires:       gnome-shell-extension-common

%description
This extension enhances the top bar moving the clock to the right, and making
the bar intelligent about its surroundings and becoming opaque if needed.

%prep
%setup -q -n top-bar-main

%build
%meson
%meson_build

%install
%meson_install

# Cleanup crap.
%{__rm} -fr %{buildroot}%{extdir}/{COPYING*,README*}

%check
%meson_test

%files
%license COPYING
%doc README.md
%{extdir}

%changelog
* Tue May 17 2022 Lains <lainsce@airmail.cc> - 1-1.2.7
- Lucky 7, the extension is fixed

* Tue May 17 2022 Lains <lainsce@airmail.cc> - 1-1.2.6
- Small steps

* Mon May 16 2022 Lains <lainsce@airmail.cc> - 1-1.2.5
- Perhaps fixed things??

* Mon May 16 2022 Lains <lainsce@airmail.cc> - 1-1.2.4
- More GJS moment of cringe

* Mon May 16 2022 Lains <lainsce@airmail.cc> - 1-1.2.3
- GJS moment

* Mon May 16 2022 Lains <lainsce@airmail.cc> - 1-1.2.2
- Small fixes

* Mon May 16 2022 Lains <lainsce@airmail.cc> - 1-1.2.1
- Small fix

* Mon May 16 2022 Lains <lainsce@airmail.cc> - 1-1.2
- Show App Name again
- Rename Activities to Workspaces

* Fri May 13 2022 Jamie Murphy <jamie@fyralabs.com> - 1-1.1
- Disable banner adjustments if notification manager is present

* Thu May 12 2022 Jamie Murphy <jamie@fyralabs.com> - 1-1
- Add metadata

* Thu May 5 2022 Lains <lainsce@airmail.cc> - 1-1
- Initial Release
