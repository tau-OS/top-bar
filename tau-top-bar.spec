%global extdir %{_datadir}/gnome-shell/extensions/top-bar@tauos.co

Summary:        Adjust Top Bar for tauOS
Name:           tau-top-bar
# This should match the version in metadata.json
Version:        1
Release:        1
License:        GPLv3+
URL:            http://tauos.co
Source0:        %{name}-%{version}.tar.gz
BuildArch:      noarch
BuildRequires:  meson
BuildRequires:  %{_bindir}/glib-compile-schemas

Requires:       gnome-shell-extension-common

%description
This extension enhances the top bar moving the clock to the right, and making
the bar intelligent about its surroundings and becoming opaque if needed.

%prep
%setup -q

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
* Thu May 12 2022 Jamie Murphy <jamie@fyralabs.com> - 1-1
- Add metadata

* Thu May 5 2022 Lains <lainsce@airmail.cc> - 1-1
- Initial Release
