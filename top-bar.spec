%global extdir %{_datadir}/gnome-shell/extensions/dash-to-dock@tauos.co

Summary:        Adjust Top Bar for tauOS
Name:           top-bar
# This should match the version in metadata.json
Version:        1
Release:        1
License:        GPLv3+
URL:            http://tauos.co
Source0:        %{name}-%{version}.tar.gz
BuildArch:      noarch
BuildRequires:  gettext
BuildRequires:  meson
BuildRequires:  sassc
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
%{__rm} -fr %{buildroot}%{extdir}/{COPYING*,README*,locale,schemas}

# Create manifest for i18n.
%find_lang %{name} --all-name

%check
%meson_test

%files -f %{name}.lang
%license COPYING
%doc README.md
%{extdir}

%changelog
* Thu May 5 2022 Lains <lainsce@airmail.cc> - 1-1
- Initial Release
