require 'rake'
require 'rake/packagetask'

MATRIX_VIEW_VERSION  = '1.1.0-dev'

task :default => [ :package ]

Rake::PackageTask.new('matrixview', MATRIX_VIEW_VERSION) do |package|
  package.need_zip = true
  package.package_dir = 'releases'
  package.package_files.include(
    'examples/**/**',
    'javascripts/**',
    'stylesheets/**',
    'LICENSE',
    'CHANGES',
    'TODO'
  )
end
